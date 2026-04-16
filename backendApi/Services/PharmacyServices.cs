using System.Text.Json;
using backendApi.Data;
using backendApi.DTOs;
using backendApi.Models;
using backendApi.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backendApi.Services;

// Product service contract.
public interface IProductService
{
    Task<List<ProductDto>> GetProductsAsync();
    Task<ProductDto?> GetProductAsync(int id);
}

// Cart service contract.
public interface ICartService
{
    Task<CartDto> AddToCartAsync(CartAddRequest request);
    Task<CartDto> GetCartAsync(int userId);
    Task<CartDto> UpdateCartAsync(CartUpdateRequest request);
    Task<CartDto> RemoveFromCartAsync(CartRemoveRequest request);
}

// Prescription service contract.
public interface IPrescriptionService
{
    Task<Prescription> UploadAsync(UploadPrescriptionRequest request);
    Task<List<Prescription>> GetByUserAsync(int userId);
    Task<Prescription?> ReviewAsync(int id, ReviewPrescriptionRequest request);
}

// Order service contract.
public interface IOrderService
{
    Task<Order> PlaceOrderAsync(PlaceOrderRequest request);
    Task<Order?> GetByIdAsync(int id);
    Task<List<Order>> GetByUserAsync(int userId);
    Task<Order?> UpdateStatusAsync(int id, UpdateOrderStatusRequest request);
}

// Reads product data and converts it into frontend-friendly DTOs.
public class ProductService(IProductRepository productRepository) : IProductService
{
    public async Task<List<ProductDto>> GetProductsAsync() =>
        (await productRepository.GetAllAsync())
            .Select(x => new ProductDto(x.Id, x.Name, x.CategoryId, x.Price, x.Dosage, x.Packaging, x.RequiresPrescription, x.Inventory?.Quantity ?? 0))
            .ToList();

    public async Task<ProductDto?> GetProductAsync(int id)
    {
        var x = await productRepository.GetByIdAsync(id);
        return x is null ? null : new ProductDto(x.Id, x.Name, x.CategoryId, x.Price, x.Dosage, x.Packaging, x.RequiresPrescription, x.Inventory?.Quantity ?? 0);
    }
}

// Handles all cart operations and stores cart items as JSON.
public class CartService(ICartRepository cartRepository, ApplicationDbContext dbContext) : ICartService
{
    public async Task<CartDto> AddToCartAsync(CartAddRequest request)
    {
        var productExists = await dbContext.Products.AnyAsync(x => x.Id == request.ProductId);
        if (!productExists) throw new InvalidOperationException("Product not found.");

        var cart = await cartRepository.GetOrCreateAsync(request.UserId);
        var items = JsonSerializer.Deserialize<List<CartItemDto>>(cart.CartItems) ?? [];
        var existing = items.FirstOrDefault(x => x.ProductId == request.ProductId);
        if (existing is null) items.Add(new CartItemDto(request.ProductId, request.Quantity));
        else items[items.IndexOf(existing)] = existing with { Quantity = existing.Quantity + request.Quantity };
        cart.CartItems = JsonSerializer.Serialize(items);
        await cartRepository.SaveAsync();
        return new CartDto(request.UserId, items);
    }

    public async Task<CartDto> GetCartAsync(int userId)
    {
        var cart = await cartRepository.GetOrCreateAsync(userId);
        return new CartDto(userId, JsonSerializer.Deserialize<List<CartItemDto>>(cart.CartItems) ?? []);
    }

    public async Task<CartDto> UpdateCartAsync(CartUpdateRequest request)
    {
        var productExists = await dbContext.Products.AnyAsync(x => x.Id == request.ProductId);
        if (!productExists) throw new InvalidOperationException("Product not found.");

        var cart = await cartRepository.GetOrCreateAsync(request.UserId);
        var items = JsonSerializer.Deserialize<List<CartItemDto>>(cart.CartItems) ?? [];
        var index = items.FindIndex(x => x.ProductId == request.ProductId);
        if (index < 0) throw new InvalidOperationException("Product is not present in cart.");
        items[index] = items[index] with { Quantity = request.Quantity };
        cart.CartItems = JsonSerializer.Serialize(items);
        await cartRepository.SaveAsync();
        return new CartDto(request.UserId, items);
    }

    public async Task<CartDto> RemoveFromCartAsync(CartRemoveRequest request)
    {
        var cart = await cartRepository.GetOrCreateAsync(request.UserId);
        var items = JsonSerializer.Deserialize<List<CartItemDto>>(cart.CartItems) ?? [];
        items = items.Where(x => x.ProductId != request.ProductId).ToList();
        cart.CartItems = JsonSerializer.Serialize(items);
        await cartRepository.SaveAsync();
        return new CartDto(request.UserId, items);
    }
}

// Handles upload/review flow of prescriptions.
public class PrescriptionService(ApplicationDbContext dbContext) : IPrescriptionService
{
    public async Task<Prescription> UploadAsync(UploadPrescriptionRequest request)
    {
        var item = new Prescription { UserId = request.UserId, FileUrl = request.FileUrl, Status = PrescriptionStatus.Pending };
        dbContext.Prescriptions.Add(item);
        await dbContext.SaveChangesAsync();
        return item;
    }

    public Task<List<Prescription>> GetByUserAsync(int userId) =>
        dbContext.Prescriptions.Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAt).ToListAsync();

    public async Task<Prescription?> ReviewAsync(int id, ReviewPrescriptionRequest request)
    {
        var item = await dbContext.Prescriptions.FirstOrDefaultAsync(x => x.Id == id);
        if (item is null) return null;
        item.Status = request.Status;
        item.ReviewedBy = request.ReviewedBy;
        await dbContext.SaveChangesAsync();
        return item;
    }
}

// Handles order placement with stock checks and DB transaction safety.
public class OrderService(ApplicationDbContext dbContext, IOrderRepository orderRepository, ICartRepository cartRepository) : IOrderService
{
    public async Task<Order> PlaceOrderAsync(PlaceOrderRequest request)
    {
        // Step 1: Read cart.
        var cart = await cartRepository.GetOrCreateAsync(request.UserId);
        var cartItems = JsonSerializer.Deserialize<List<CartItemDto>>(cart.CartItems) ?? [];
        if (cartItems.Count == 0) throw new InvalidOperationException("Cart is empty.");

        var productIds = cartItems.Select(x => x.ProductId).Distinct().ToList();
        var products = await dbContext.Products.Include(x => x.Inventory).Where(x => productIds.Contains(x.Id)).ToListAsync();

        // Step 2: Validate stock.
        foreach (var item in cartItems)
        {
            var p = products.FirstOrDefault(x => x.Id == item.ProductId) ?? throw new InvalidOperationException("Product not found.");
            if ((p.Inventory?.Quantity ?? 0) < item.Quantity) throw new InvalidOperationException($"Insufficient stock for product {p.Name}.");
        }

        // Step 3: If any item needs prescription, verify approved prescription.
        if (products.Any(x => x.RequiresPrescription))
        {
            if (!request.PrescriptionId.HasValue) throw new InvalidOperationException("Prescription is required for this order.");
            var approved = await dbContext.Prescriptions.AnyAsync(x => x.Id == request.PrescriptionId && x.UserId == request.UserId && x.Status == PrescriptionStatus.Approved);
            if (!approved) throw new InvalidOperationException("Prescription not approved.");
        }

        // Step 4 onward: create order + items + deduct stock in one transaction.
        await using var transaction = await dbContext.Database.BeginTransactionAsync();

        var order = new Order
        {
            UserId = request.UserId,
            PrescriptionId = request.PrescriptionId,
            Status = OrderStatus.Placed,
            TotalAmount = cartItems.Sum(i =>
            {
                var product = products.First(x => x.Id == i.ProductId);
                return product.Price * i.Quantity;
            })
        };

        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();

        foreach (var item in cartItems)
        {
            var product = products.First(x => x.Id == item.ProductId);
            dbContext.OrderItems.Add(new OrderItem
            {
                OrderId = order.Id,
                ProductId = product.Id,
                Quantity = item.Quantity,
                Price = product.Price
            });
            if (product.Inventory is not null)
            {
                product.Inventory.Quantity -= item.Quantity;
                product.Inventory.UpdatedAt = DateTime.UtcNow;
            }
        }

        dbContext.OrderStatusHistories.Add(new OrderStatusHistory { OrderId = order.Id, Status = OrderStatus.Placed });
        cart.CartItems = "[]";
        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return await orderRepository.GetByIdAsync(order.Id) ?? order;
    }

    public Task<Order?> GetByIdAsync(int id) => orderRepository.GetByIdAsync(id);
    public Task<List<Order>> GetByUserAsync(int userId) => orderRepository.GetByUserIdAsync(userId);

    public async Task<Order?> UpdateStatusAsync(int id, UpdateOrderStatusRequest request)
    {
        var order = await dbContext.Orders.FirstOrDefaultAsync(x => x.Id == id);
        if (order is null) return null;

        var allowedTransitions = new Dictionary<OrderStatus, OrderStatus>
        {
            [OrderStatus.Placed] = OrderStatus.Confirmed,
            [OrderStatus.Confirmed] = OrderStatus.Packed,
            [OrderStatus.Packed] = OrderStatus.Shipped,
            [OrderStatus.Shipped] = OrderStatus.OutForDelivery,
            [OrderStatus.OutForDelivery] = OrderStatus.Delivered
        };

        if (!allowedTransitions.TryGetValue(order.Status, out var nextStatus) || nextStatus != request.Status)
        {
            throw new InvalidOperationException($"Invalid status transition from {order.Status} to {request.Status}.");
        }

        order.Status = request.Status;
        dbContext.OrderStatusHistories.Add(new OrderStatusHistory { OrderId = id, Status = request.Status });
        await dbContext.SaveChangesAsync();
        return await orderRepository.GetByIdAsync(id);
    }
}
