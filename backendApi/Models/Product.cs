using System.ComponentModel.DataAnnotations;

namespace backendApi.Models;

public class Product
{
    public int Id { get; set; }
    [Required]
    public required string Name { get; set; }
    public int CategoryId { get; set; }
    public decimal Price { get; set; }
    [Required]
    public required string Dosage { get; set; }
    [Required]
    public required string Packaging { get; set; }
    public bool RequiresPrescription { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Category? Category { get; set; }
    public Inventory? Inventory { get; set; }
}
