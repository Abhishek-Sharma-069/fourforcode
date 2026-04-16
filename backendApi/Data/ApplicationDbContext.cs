using Microsoft.EntityFrameworkCore;
using backendApi.Models;
using backendApi.Configurations;

namespace backendApi.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Inventory> Inventories { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfiguration(new UserConfiguration());
            modelBuilder.ApplyConfiguration(new CategoryConfiguration());
            modelBuilder.ApplyConfiguration(new ProductConfiguration());
            modelBuilder.ApplyConfiguration(new InventoryConfiguration());
            modelBuilder.ApplyConfiguration(new PrescriptionConfiguration());
            modelBuilder.ApplyConfiguration(new CartConfiguration());
            modelBuilder.ApplyConfiguration(new OrderConfiguration());
            modelBuilder.ApplyConfiguration(new OrderItemConfiguration());
            modelBuilder.ApplyConfiguration(new OrderStatusHistoryConfiguration());

            modelBuilder.Entity<Category>()
                .HasMany(x => x.Products)
                .WithOne(x => x.Category)
                .HasForeignKey(x => x.CategoryId);

            modelBuilder.Entity<Product>()
                .HasOne(x => x.Inventory)
                .WithOne(x => x.Product)
                .HasForeignKey<Inventory>(x => x.ProductId);

            modelBuilder.Entity<User>()
                .HasMany(x => x.Orders)
                .WithOne(x => x.User)
                .HasForeignKey(x => x.UserId);

            modelBuilder.Entity<User>()
                .HasMany(x => x.Prescriptions)
                .WithOne(x => x.User)
                .HasForeignKey(x => x.UserId);

            modelBuilder.Entity<User>()
                .HasOne(x => x.Cart)
                .WithOne(x => x.User)
                .HasForeignKey<Cart>(x => x.UserId);

            modelBuilder.Entity<Order>()
                .HasMany(x => x.OrderItems)
                .WithOne(x => x.Order)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Order>()
                .HasMany(x => x.StatusHistory)
                .WithOne(x => x.Order)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
