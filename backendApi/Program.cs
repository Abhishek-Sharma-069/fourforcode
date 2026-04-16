// This is the starting point of the backend app.
// Think of it as the "main control room" where we connect all backend parts.
using Microsoft.EntityFrameworkCore;
using backendApi.Data;
using backendApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using backendApi.Repositories;
using backendApi.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Register features (services) that the app will use.
builder.Services.AddOpenApi("v1");
builder.Services.AddControllers();

// Connect Entity Framework to PostgreSQL database.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register business logic classes and repositories.
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IPrescriptionService, PrescriptionService>();
builder.Services.AddScoped<IOrderService, OrderService>();

// Configure JWT authentication (how login tokens are validated).
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration.GetSection("JwtSettings");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecretKey"] ?? "your-super-secret-key-here-make-it-long-and-secure"))
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (string.IsNullOrWhiteSpace(context.Token) &&
                    context.Request.Cookies.TryGetValue("auth_token", out var cookieToken))
                {
                    context.Token = cookieToken;
                }

                return Task.CompletedTask;
            }
        };
    });

// Configure authorization (who can access which APIs).
builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// In development mode, expose OpenAPI docs + Swagger screen.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/swagger/v1/swagger.json");
    app.MapGet("/swagger/index.html", () => Results.Redirect("/swagger"));
    app.MapGet("/swagger", () => Results.Content(
        """
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>backendApi Swagger UI</title>
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
          <script>
            window.ui = SwaggerUIBundle({
              url: '/swagger/v1/swagger.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              displayRequestDuration: true
            });
          </script>
        </body>
        </html>
        """, "text/html"));
}

app.UseHttpsRedirection();
// Global exception handler gives user-friendly error JSON.
app.UseMiddleware<GlobalExceptionMiddleware>();
// CORS lets frontend call backend from another origin/port.
app.UseCors("FrontendDev");

// Enforce login checks and role checks.
app.UseAuthentication();
app.UseAuthorization();

// Expose all controller routes.
app.MapControllers();

app.Run();
