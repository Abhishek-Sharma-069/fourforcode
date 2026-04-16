namespace backendApi.Models;

public enum UserRole
{
    User = 0,
    Admin = 1
}

public enum PrescriptionStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public enum OrderStatus
{
    Placed = 0,
    Confirmed = 1,
    Packed = 2,
    Shipped = 3,
    OutForDelivery = 4,
    Delivered = 5
}
