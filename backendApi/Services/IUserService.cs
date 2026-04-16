using backendApi.DTOs;

namespace backendApi.Services
{
    // Contract for user account features.
    public interface IUserService
    {
        // Create a new account.
        Task<RegisterResponse> RegisterAsync(RegisterRequest request);
        // Check credentials and create login response.
        Task<LoginResponse> LoginAsync(LoginRequest request);
    }
}
