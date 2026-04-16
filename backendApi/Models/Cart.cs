namespace backendApi.Models;

// Shopping cart for one user (items stored as JSON text).
public class Cart
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string CartItems { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
