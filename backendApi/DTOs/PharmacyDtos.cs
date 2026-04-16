using System.ComponentModel.DataAnnotations;
using backendApi.Models;

namespace backendApi.DTOs;

public record ProductDto(int Id, string Name, int CategoryId, decimal Price, string Dosage, string Packaging, bool RequiresPrescription, int Quantity);
public record CartItemDto(int ProductId, int Quantity);
public record CartDto(int UserId, List<CartItemDto> Items);

public class CartAddRequest
{
    [Required] public int UserId { get; set; }
    [Required] public int ProductId { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; }
}

public class CartUpdateRequest
{
    [Required] public int UserId { get; set; }
    [Required] public int ProductId { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; }
}

public class CartRemoveRequest
{
    [Required] public int UserId { get; set; }
    [Required] public int ProductId { get; set; }
}

public class UploadPrescriptionRequest
{
    [Required] public int UserId { get; set; }
    [Required] public string FileUrl { get; set; } = string.Empty;
}

public class ReviewPrescriptionRequest
{
    [Required] public PrescriptionStatus Status { get; set; }
    public int? ReviewedBy { get; set; }
}

public class PlaceOrderRequest
{
    [Required] public int UserId { get; set; }
    public int? PrescriptionId { get; set; }
}

public class UpdateOrderStatusRequest
{
    [Required] public OrderStatus Status { get; set; }
}
