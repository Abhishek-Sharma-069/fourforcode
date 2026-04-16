using System.ComponentModel.DataAnnotations;
using backendApi.Models;

namespace backendApi.DTOs;

// Request body for creating a new product with initial stock.
public class CreateProductRequest
{
    [Required] public required string Name { get; set; }
    [Required] public int CategoryId { get; set; }
    [Range(0.01, double.MaxValue)] public decimal Price { get; set; }
    [Required] public required string Dosage { get; set; }
    [Required] public required string Packaging { get; set; }
    public bool RequiresPrescription { get; set; }
    [Range(0, int.MaxValue)] public int InitialStock { get; set; }
}

// Request body for updating an existing product.
public class UpdateProductRequest
{
    public string? Name { get; set; }
    public int? CategoryId { get; set; }
    public decimal? Price { get; set; }
    public string? Dosage { get; set; }
    public string? Packaging { get; set; }
    public bool? RequiresPrescription { get; set; }
}

// Request body for setting inventory quantity.
public class UpdateInventoryRequest
{
    [Range(0, int.MaxValue)] public int Quantity { get; set; }
}

// Request body for creating a new category.
public class CreateCategoryRequest
{
    [Required] public required string Name { get; set; }
}

// Request body for admin to change user role.
public class UpdateUserRoleRequest
{
    [Required] public UserRole Role { get; set; }
}

// Safe admin view of a user.
public record AdminUserDto(int Id, string Name, string Email, string Role, DateTime CreatedAt, int OrderCount);

// Safe admin view of a category.
public record CategoryDto(int Id, string Name, int ProductCount);

// Admin view of an order.
public record AdminOrderDto(
    int Id,
    int UserId,
    string UserName,
    string UserEmail,
    int? PrescriptionId,
    decimal TotalAmount,
    string Status,
    DateTime CreatedAt,
    List<AdminOrderItemDto> Items,
    List<AdminOrderStatusHistoryDto> StatusHistory
);

public record AdminOrderItemDto(int ProductId, string ProductName, int Quantity, decimal Price);
public record AdminOrderStatusHistoryDto(string Status, DateTime ChangedAt);
