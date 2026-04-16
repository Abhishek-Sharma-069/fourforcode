using backendApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backendApi.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.Name).HasColumnName("name").IsRequired();
        builder.Property(x => x.Email).HasColumnName("email").IsRequired();
        builder.Property(x => x.PasswordHash).HasColumnName("password_hash").IsRequired();
        builder.Property(x => x.Role).HasColumnName("role").HasConversion<string>().IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.HasIndex(x => x.Email).IsUnique();
    }
}

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.Name).HasColumnName("name").IsRequired();
    }
}

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.CategoryId).HasColumnName("category_id");
        builder.Property(x => x.Name).HasColumnName("name").IsRequired();
        builder.Property(x => x.Price).HasColumnName("price").HasPrecision(10, 2);
        builder.Property(x => x.Dosage).HasColumnName("dosage").IsRequired();
        builder.Property(x => x.Packaging).HasColumnName("packaging").IsRequired();
        builder.Property(x => x.RequiresPrescription).HasColumnName("requires_prescription");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
    }
}

public class InventoryConfiguration : IEntityTypeConfiguration<Inventory>
{
    public void Configure(EntityTypeBuilder<Inventory> builder)
    {
        builder.ToTable("inventories");
        builder.HasKey(x => x.ProductId);
        builder.Property(x => x.ProductId).HasColumnName("product_id");
        builder.Property(x => x.Quantity).HasColumnName("quantity");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
        builder.HasCheckConstraint("ck_inventories_quantity_non_negative", "quantity >= 0");
    }
}

public class PrescriptionConfiguration : IEntityTypeConfiguration<Prescription>
{
    public void Configure(EntityTypeBuilder<Prescription> builder)
    {
        builder.ToTable("prescriptions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.FileUrl).HasColumnName("file_url").IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().IsRequired();
        builder.Property(x => x.ReviewedBy).HasColumnName("reviewed_by");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
    }
}

public class CartConfiguration : IEntityTypeConfiguration<Cart>
{
    public void Configure(EntityTypeBuilder<Cart> builder)
    {
        builder.ToTable("carts");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.CartItems).HasColumnName("cart_items").HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.HasIndex(x => x.UserId).IsUnique();
    }
}

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.PrescriptionId).HasColumnName("prescription_id");
        builder.Property(x => x.TotalAmount).HasColumnName("total_amount").HasPrecision(10, 2);
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
    }
}

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("order_items");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.OrderId).HasColumnName("order_id");
        builder.Property(x => x.ProductId).HasColumnName("product_id");
        builder.Property(x => x.Quantity).HasColumnName("quantity");
        builder.Property(x => x.Price).HasColumnName("price").HasPrecision(10, 2);
    }
}

public class OrderStatusHistoryConfiguration : IEntityTypeConfiguration<OrderStatusHistory>
{
    public void Configure(EntityTypeBuilder<OrderStatusHistory> builder)
    {
        builder.ToTable("order_status_histories");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.OrderId).HasColumnName("order_id");
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
    }
}
