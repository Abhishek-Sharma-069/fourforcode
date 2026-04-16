using System.ComponentModel.DataAnnotations;
using backendApi.Models;

namespace backendApi.DTOs;

// Read-only product shape returned to frontend.
public record ProductDto(int Id, string Name, int CategoryId, decimal Price, string Dosage, string Packaging, bool RequiresPrescription, int Quantity);
// One item inside cart JSON.
public record CartItemDto(int ProductId, int Quantity);
// Enriched cart item returned by API.
public record CartItemResponseDto(int ProductId, int Quantity, string ProductName, string Category);
// Cart response shape.
public record CartDto(int UserId, List<CartItemResponseDto> Items);
// One item inside order response.
public record OrderItemDto(int Id, int OrderId, int ProductId, int Quantity, decimal Price, string ProductName);
// One status-history entry inside order response.
public record OrderStatusHistoryDto(int Id, int OrderId, OrderStatus Status, DateTime ChangedAt);
// Order response shape.
public record OrderDto(int Id, int UserId, int? PrescriptionId, decimal TotalAmount, OrderStatus Status, DateTime CreatedAt, List<OrderItemDto> OrderItems, List<OrderStatusHistoryDto> StatusHistory);

// Request body for add-to-cart API.
public class CartAddRequest
{
    [Required] public int UserId { get; set; }
    [Required] public int ProductId { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; }
}

// Request body for cart quantity update API.
public class CartUpdateRequest
{
    [Required] public int UserId { get; set; }
    [Required] public int ProductId { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; }
}

// Request body for removing product from cart.
public class CartRemoveRequest
{
    [Required] public int UserId { get; set; }
    [Required] public int ProductId { get; set; }
}

// Request body for uploading prescription reference.
public class UploadPrescriptionRequest
{
    [Required] public int UserId { get; set; }
    [Required] public string FileUrl { get; set; } = string.Empty;
}

// Request body used by admin to approve/reject prescription.
public class ReviewPrescriptionRequest
{
    [Required] public PrescriptionStatus Status { get; set; }
    public int? ReviewedBy { get; set; }
}

// Request body for placing order.
public class PlaceOrderRequest
{
    [Required] public int UserId { get; set; }
    public int? PrescriptionId { get; set; }
    public int? ProductId { get; set; }
}

// Request body for admin order status update.
public class UpdateOrderStatusRequest
{
    [Required] public OrderStatus Status { get; set; }
}
