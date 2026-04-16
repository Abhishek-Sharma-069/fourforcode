using backendApi.Data;
using backendApi.DTOs;
using backendApi.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace backendApi.Services
{
    // Contains the real logic for register/login and JWT token creation.
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IConfiguration _configuration;

        public UserService(ApplicationDbContext dbContext, IConfiguration configuration)
        {
            _dbContext = dbContext;
            _configuration = configuration;
        }

        public async Task<RegisterResponse> RegisterAsync(RegisterRequest request)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (existingUser != null)
                {
                    return new RegisterResponse
                    {
                        Success = false,
                        Message = "Email already registered"
                    };
                }

                // Hash the password
                var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

                // Create new user
                var user = new User
                {
                    Name = request.Name,
                    Email = request.Email,
                    PasswordHash = passwordHash,
                    Role = UserRole.User,
                    CreatedAt = DateTime.UtcNow
                };

                _dbContext.Users.Add(user);
                await _dbContext.SaveChangesAsync();

                return new RegisterResponse
                {
                    Success = true,
                    Message = "User registered successfully",
                    User = new UserDto
                    {
                        Id = user.Id,
                        Name = user.Name,
                        Email = user.Email,
                        Role = user.Role.ToString(),
                        CreatedAt = user.CreatedAt
                    }
                };
            }
            catch (Exception ex)
            {
                return new RegisterResponse
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                };
            }
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request)
        {
            try
            {
                // Find user by email
                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (user == null)
                {
                    return new LoginResponse
                    {
                        Success = false,
                        Message = "Invalid email or password"
                    };
                }

                // Verify password
                var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
                if (!isPasswordValid)
                {
                    return new LoginResponse
                    {
                        Success = false,
                        Message = "Invalid email or password"
                    };
                }

                // Generate JWT token
                var token = GenerateJwtToken(user);

                return new LoginResponse
                {
                    Success = true,
                    Message = "Login successful",
                    Token = token,
                    User = new UserDto
                    {
                        Id = user.Id,
                        Name = user.Name,
                        Email = user.Email,
                        Role = user.Role.ToString(),
                        CreatedAt = user.CreatedAt
                    }
                };
            }
            catch (Exception ex)
            {
                return new LoginResponse
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                };
            }
        }

        private string GenerateJwtToken(User user)
        {
            // Build token settings from appsettings.json.
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? "your-super-secret-key-here-make-it-long-and-secure";
            var issuer = jwtSettings["Issuer"] ?? "backendApi";
            var audience = jwtSettings["Audience"] ?? "backendApi-users";
            var expiryMinutes = int.TryParse(jwtSettings["ExpiryInMinutes"], out var parsedMinutes) ? parsedMinutes : 10080;

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // These claims are small user details embedded inside token.
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role.ToString().ToUpperInvariant()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
