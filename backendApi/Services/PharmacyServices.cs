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
    Task<OrderDto> PlaceOrderAsync(PlaceOrderRequest request);
    Task<OrderDto?> GetByIdAsync(int id);
    Task<List<OrderDto>> GetByUserAsync(int userId);
    Task<OrderDto?> UpdateStatusAsync(int id, UpdateOrderStatusRequest request);
    Task<OrderDto?> CancelAsync(int id, int requesterUserId, bool isAdmin);
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
        return await BuildCartDtoAsync(request.UserId, items);
    }

    public async Task<CartDto> GetCartAsync(int userId)
    {
        var cart = await cartRepository.GetOrCreateAsync(userId);
        var items = JsonSerializer.Deserialize<List<CartItemDto>>(cart.CartItems) ?? [];
        return await BuildCartDtoAsync(userId, items);
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
        return await BuildCartDtoAsync(request.UserId, items);
    }

    public async Task<CartDto> RemoveFromCartAsync(CartRemoveRequest request)
    {
        var cart = await cartRepository.GetOrCreateAsync(request.UserId);
        var items = JsonSerializer.Deserialize<List<CartItemDto>>(cart.CartItems) ?? [];
        items = items.Where(x => x.ProductId != request.ProductId).ToList();
        cart.CartItems = JsonSerializer.Serialize(items);
        await cartRepository.SaveAsync();
        return await BuildCartDtoAsync(request.UserId, items);
    }

    private async Task<CartDto> BuildCartDtoAsync(int userId, List<CartItemDto> items)
    {
        var productIds = items.Select(x => x.ProductId).Distinct().ToList();
        var productLookup = await dbContext.Products
            .Include(x => x.Category)
            .AsNoTracking()
            .Where(x => productIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id);

        var responseItems = items
            .Select(item =>
            {
                if (!productLookup.TryGetValue(item.ProductId, out var product))
                {
                    throw new InvalidOperationException($"Product {item.ProductId} not found.");
                }

                return new CartItemResponseDto(
                    item.ProductId,
                    item.Quantity,
                    product.Name,
                    product.Category?.Name ?? string.Empty,
                    product.RequiresPrescription);
            })
            .ToList();

        return new CartDto(userId, responseItems);
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
    public async Task<OrderDto> PlaceOrderAsync(PlaceOrderRequest request)
    {
        // Step 1: Read cart.
        var cart = await cartRepository.GetOrCreateAsync(request.UserId);
        var allCartItems = JsonSerializer.Deserialize<List<CartItemDto>>(cart.CartItems) ?? [];
        var cartItems = request.ProductId.HasValue
            ? allCartItems.Where(x => x.ProductId == request.ProductId.Value).ToList()
            : allCartItems;

        if (cartItems.Count == 0) throw new InvalidOperationException("Cart is empty.");

        var productIds = cartItems.Select(x => x.ProductId).Distinct().ToList();
        var products = await dbContext.Products.Include(x => x.Inventory).Where(x => productIds.Contains(x.Id)).ToListAsync();

        // Step 2: Validate stock.
        foreach (var item in cartItems)
        {
            var p = products.FirstOrDefault(x => x.Id == item.ProductId) ?? throw new InvalidOperationException("Product not found.");
            if ((p.Inventory?.Quantity ?? 0) < item.Quantity) throw new InvalidOperationException($"Insufficient stock for product {p.Name}.");
        }

        // Step 3: If any item needs prescription, verify the user has attached a non-rejected prescription.
        if (products.Any(x => x.RequiresPrescription))
        {
            if (!request.PrescriptionId.HasValue) throw new InvalidOperationException("Prescription is required for this order.");
            var hasValidPrescription = await dbContext.Prescriptions.AnyAsync(x =>
                x.Id == request.PrescriptionId &&
                x.UserId == request.UserId &&
                x.Status != PrescriptionStatus.Rejected);
            if (!hasValidPrescription) throw new InvalidOperationException("Prescription is invalid or has been rejected.");
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
        if (request.ProductId.HasValue)
        {
            var remainingItems = allCartItems.Where(x => x.ProductId != request.ProductId.Value).ToList();
            cart.CartItems = JsonSerializer.Serialize(remainingItems);
        }
        else
        {
            cart.CartItems = "[]";
        }

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        order.OrderItems = cartItems.Select(item =>
        {
            var product = products.First(x => x.Id == item.ProductId);
            return new OrderItem
            {
                Id = 0,
                OrderId = order.Id,
                ProductId = product.Id,
                Quantity = item.Quantity,
                Price = product.Price,
                Product = product
            };
        }).ToList();
        order.StatusHistory = [new OrderStatusHistory { Id = 0, OrderId = order.Id, Status = OrderStatus.Placed, UpdatedAt = DateTime.UtcNow }];

        return MapOrder(order);
    }

    public async Task<OrderDto?> GetByIdAsync(int id)
    {
        var order = await orderRepository.GetByIdAsync(id);
        return order is null ? null : MapOrder(order);
    }

    public async Task<List<OrderDto>> GetByUserAsync(int userId) =>
        (await orderRepository.GetByUserIdAsync(userId)).Select(MapOrder).ToList();

    public async Task<OrderDto?> UpdateStatusAsync(int id, UpdateOrderStatusRequest request)
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
        var updatedOrder = await orderRepository.GetByIdAsync(id);
        return updatedOrder is null ? null : MapOrder(updatedOrder);
    }

    public async Task<OrderDto?> CancelAsync(int id, int requesterUserId, bool isAdmin)
    {
        var order = await dbContext.Orders
            .Include(x => x.OrderItems)
            .ThenInclude(x => x.Product)
            .ThenInclude(x => x!.Inventory)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (order is null) return null;
        if (!isAdmin && order.UserId != requesterUserId) throw new UnauthorizedAccessException("You cannot cancel this order.");
        if (order.Status == OrderStatus.Cancelled) throw new InvalidOperationException("Order is already cancelled.");
        if (order.Status == OrderStatus.Delivered) throw new InvalidOperationException("Delivered order cannot be cancelled.");

        foreach (var item in order.OrderItems)
        {
            if (item.Product?.Inventory is not null)
            {
                item.Product.Inventory.Quantity += item.Quantity;
                item.Product.Inventory.UpdatedAt = DateTime.UtcNow;
            }
        }

        order.Status = OrderStatus.Cancelled;
        dbContext.OrderStatusHistories.Add(new OrderStatusHistory { OrderId = id, Status = OrderStatus.Cancelled });
        await dbContext.SaveChangesAsync();

        var cancelledOrder = await orderRepository.GetByIdAsync(id);
        return cancelledOrder is null ? null : MapOrder(cancelledOrder);
    }

    private static OrderDto MapOrder(Order order) =>
        new(
            order.Id,
            order.UserId,
            order.PrescriptionId,
            order.TotalAmount,
            order.Status,
            order.CreatedAt,
            order.OrderItems
                .OrderBy(x => x.Id)
                .Select(x => new OrderItemDto(x.Id, x.OrderId, x.ProductId, x.Quantity, x.Price, x.Product?.Name ?? string.Empty))
                .ToList(),
            order.StatusHistory
                .OrderBy(x => x.UpdatedAt)
                .Select(x => new OrderStatusHistoryDto(x.Id, x.OrderId, x.Status, x.UpdatedAt))
                .ToList());
}
