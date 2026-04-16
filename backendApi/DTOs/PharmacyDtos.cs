using System.ComponentModel.DataAnnotations;
using backendApi.Models;

namespace backendApi.DTOs;

// Read-only product shape returned to frontend.
public record ProductDto(int Id, string Name, int CategoryId, decimal Price, string Dosage, string Packaging, bool RequiresPrescription, int Quantity);
// One item inside cart JSON.
public record CartItemDto(int ProductId, int Quantity);
// Cart response shape.
public record CartDto(int UserId, List<CartItemDto> Items);

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
}

// Request body for admin order status update.
public class UpdateOrderStatusRequest
{
    [Required] public OrderStatus Status { get; set; }
}
