namespace backendApi.Models;

// Role values for app users.
public enum UserRole
{
    User = 0,
    Admin = 1
}

// Review status of prescription.
public enum PrescriptionStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

// Delivery journey states of order.
public enum OrderStatus
{
    Placed = 0,
    Confirmed = 1,
    Packed = 2,
    Shipped = 3,
    OutForDelivery = 4,
    Delivered = 5,
    Cancelled = 6
}
