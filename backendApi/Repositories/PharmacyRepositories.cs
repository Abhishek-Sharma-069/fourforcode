using backendApi.Data;
using backendApi.Models;
using Microsoft.EntityFrameworkCore;

namespace backendApi.Repositories;

// Product database access contract.
public interface IProductRepository
{
    Task<List<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
}

// Cart database access contract.
public interface ICartRepository
{
    Task<Cart> GetOrCreateAsync(int userId);
    Task SaveAsync();
}

// Order database access contract.
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(int id);
    Task<List<Order>> GetByUserIdAsync(int userId);
    Task SaveAsync();
}

// Data-layer class for product table operations.
public class ProductRepository(ApplicationDbContext dbContext) : IProductRepository
{
    public Task<List<Product>> GetAllAsync() =>
        dbContext.Products.Include(x => x.Inventory).AsNoTracking().ToListAsync();

    public Task<Product?> GetByIdAsync(int id) =>
        dbContext.Products.Include(x => x.Inventory).AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
}

// Data-layer class for cart table operations.
public class CartRepository(ApplicationDbContext dbContext) : ICartRepository
{
    public async Task<Cart> GetOrCreateAsync(int userId)
    {
        var cart = await dbContext.Carts.FirstOrDefaultAsync(x => x.UserId == userId);
        if (cart is not null) return cart;
        cart = new Cart { UserId = userId, CartItems = "[]" };
        dbContext.Carts.Add(cart);
        await dbContext.SaveChangesAsync();
        return cart;
    }

    public Task SaveAsync() => dbContext.SaveChangesAsync();
}

// Data-layer class for order table operations.
public class OrderRepository(ApplicationDbContext dbContext) : IOrderRepository
{
    public Task<Order?> GetByIdAsync(int id) =>
        dbContext.Orders
            .Include(x => x.OrderItems)
            .ThenInclude(x => x.Product)
            .Include(x => x.StatusHistory)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

    public Task<List<Order>> GetByUserIdAsync(int userId) =>
        dbContext.Orders
            .Include(x => x.OrderItems)
            .ThenInclude(x => x.Product)
            .Include(x => x.StatusHistory)
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

    public Task SaveAsync() => dbContext.SaveChangesAsync();
}
