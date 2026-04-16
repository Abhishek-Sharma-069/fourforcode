namespace backendApi.Models;

// Current stock quantity for one product.
public class Inventory
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Product? Product { get; set; }
}
