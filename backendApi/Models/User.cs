using System.ComponentModel.DataAnnotations;

namespace backendApi.Models
{
    public class User
    {
        public int Id { get; set; }
        [Required]
        public required string Name { get; set; }
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
        [Required]
        public required string PasswordHash { get; set; }
        [Required]
        public UserRole Role { get; set; } = UserRole.User;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
        public Cart? Cart { get; set; }
    }
}