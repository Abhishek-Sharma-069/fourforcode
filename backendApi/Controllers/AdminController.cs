using backendApi.Data;
using backendApi.DTOs;
using backendApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backendApi.Controllers;

// Admin-only controller for inventory, product, user & order management.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN")]
public class AdminController(ApplicationDbContext dbContext) : ControllerBase
{
    // ─── CATEGORIES ───────────────────────────────────────────────

    [HttpGet("categories")]
    // Returns all categories with product count.
    public async Task<IActionResult> GetCategories()
    {
        var categories = await dbContext.Categories
            .Include(c => c.Products)
            .AsNoTracking()
            .Select(c => new CategoryDto(c.Id, c.Name, c.Products.Count))
            .ToListAsync();
        return Ok(categories);
    }

    [HttpPost("categories")]
    // Creates a new category.
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var exists = await dbContext.Categories.AnyAsync(c => c.Name == request.Name);
        if (exists) return BadRequest(new { message = "Category already exists." });

        var category = new Category { Name = request.Name };
        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync();
        return Ok(new CategoryDto(category.Id, category.Name, 0));
    }

    // ─── PRODUCTS ─────────────────────────────────────────────────

    [HttpPost("products")]
    // Creates a new product with initial inventory stock.
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var categoryExists = await dbContext.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists) return BadRequest(new { message = "Category not found." });

        var product = new Product
        {
            Name = request.Name,
            CategoryId = request.CategoryId,
            Price = request.Price,
            Dosage = request.Dosage,
            Packaging = request.Packaging,
            RequiresPrescription = request.RequiresPrescription
        };
        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync();

        // Create inventory record with initial stock.
        var inventory = new Inventory
        {
            ProductId = product.Id,
            Quantity = request.InitialStock
        };
        dbContext.Inventories.Add(inventory);
        await dbContext.SaveChangesAsync();

        return Ok(new ProductDto(product.Id, product.Name, product.CategoryId, product.Price, product.Dosage, product.Packaging, product.RequiresPrescription, inventory.Quantity));
    }

    [HttpPut("products/{id:int}")]
    // Updates an existing product's details.
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
    {
        var product = await dbContext.Products.Include(p => p.Inventory).FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return NotFound(new { message = "Product not found." });

        if (request.Name is not null) product.Name = request.Name;
        if (request.CategoryId.HasValue) product.CategoryId = request.CategoryId.Value;
        if (request.Price.HasValue) product.Price = request.Price.Value;
        if (request.Dosage is not null) product.Dosage = request.Dosage;
        if (request.Packaging is not null) product.Packaging = request.Packaging;
        if (request.RequiresPrescription.HasValue) product.RequiresPrescription = request.RequiresPrescription.Value;

        await dbContext.SaveChangesAsync();
        return Ok(new ProductDto(product.Id, product.Name, product.CategoryId, product.Price, product.Dosage, product.Packaging, product.RequiresPrescription, product.Inventory?.Quantity ?? 0));
    }

    [HttpDelete("products/{id:int}")]
    // Deletes a product and its inventory record.
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await dbContext.Products.Include(p => p.Inventory).FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return NotFound(new { message = "Product not found." });

        if (product.Inventory is not null) dbContext.Inventories.Remove(product.Inventory);
        dbContext.Products.Remove(product);
        await dbContext.SaveChangesAsync();
        return Ok(new { message = "Product deleted." });
    }

    // ─── INVENTORY ────────────────────────────────────────────────

    [HttpPut("inventory/{productId:int}")]
    // Sets inventory quantity for a product.
    public async Task<IActionResult> UpdateInventory(int productId, [FromBody] UpdateInventoryRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var inventory = await dbContext.Inventories.FirstOrDefaultAsync(i => i.ProductId == productId);
        if (inventory is null)
        {
            var productExists = await dbContext.Products.AnyAsync(p => p.Id == productId);
            if (!productExists) return NotFound(new { message = "Product not found." });

            inventory = new Inventory { ProductId = productId, Quantity = request.Quantity };
            dbContext.Inventories.Add(inventory);
        }
        else
        {
            inventory.Quantity = request.Quantity;
            inventory.UpdatedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync();
        return Ok(new { productId, quantity = inventory.Quantity });
    }

    // ─── USERS ────────────────────────────────────────────────────

    [HttpGet("users")]
    // Returns all users with their order count.
    public async Task<IActionResult> GetUsers()
    {
        var users = await dbContext.Users
            .Include(u => u.Orders)
            .AsNoTracking()
            .Select(u => new AdminUserDto(u.Id, u.Name, u.Email, u.Role.ToString(), u.CreatedAt, u.Orders.Count))
            .ToListAsync();
        return Ok(users);
    }

    [HttpPut("users/{id:int}/role")]
    // Updates a user's role (User or Admin).
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleRequest request)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound(new { message = "User not found." });

        user.Role = request.Role;
        await dbContext.SaveChangesAsync();
        return Ok(new { message = $"User {id} role updated to {request.Role}." });
    }

    [HttpDelete("users/{id:int}")]
    // Deletes a user account.
    public async Task<IActionResult> DeleteUser(int id)
    {
        var requesterId = this.GetAuthenticatedUserId();
        if (requesterId == id) return BadRequest(new { message = "Cannot delete your own account." });

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound(new { message = "User not found." });

        dbContext.Users.Remove(user);
        await dbContext.SaveChangesAsync();
        return Ok(new { message = "User deleted." });
    }

    // ─── ORDERS (ALL) ─────────────────────────────────────────────

    [HttpGet("orders")]
    // Returns all orders from all users for admin overview.
    public async Task<IActionResult> GetAllOrders()
    {
        var orders = await dbContext.Orders
            .Include(o => o.User)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .Include(o => o.StatusHistory)
            .AsNoTracking()
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var dtos = orders.Select(o => new AdminOrderDto(
            o.Id,
            o.UserId,
            o.User?.Name ?? "Unknown",
            o.User?.Email ?? "Unknown",
            o.PrescriptionId,
            o.TotalAmount,
            o.Status.ToString(),
            o.CreatedAt,
            o.OrderItems.Select(oi => new AdminOrderItemDto(oi.ProductId, oi.Product?.Name ?? "Unknown", oi.Quantity, oi.Price)).ToList(),
            o.StatusHistory.OrderBy(s => s.UpdatedAt).Select(s => new AdminOrderStatusHistoryDto(s.Status.ToString(), s.UpdatedAt)).ToList()
        )).ToList();

        return Ok(dtos);
    }
}
