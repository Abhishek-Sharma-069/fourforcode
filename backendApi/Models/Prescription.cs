namespace backendApi.Models;

public class Prescription
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public required string FileUrl { get; set; }
    public PrescriptionStatus Status { get; set; } = PrescriptionStatus.Pending;
    public int? ReviewedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
