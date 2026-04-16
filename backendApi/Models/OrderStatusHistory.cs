namespace backendApi.Models;

// Stores timeline/history of status changes for an order.
public class OrderStatusHistory
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Order? Order { get; set; }
}
