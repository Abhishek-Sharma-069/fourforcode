using System.ComponentModel.DataAnnotations;

namespace backendApi.Models;

public class Category
{
    public int Id { get; set; }
    [Required]
    public required string Name { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
