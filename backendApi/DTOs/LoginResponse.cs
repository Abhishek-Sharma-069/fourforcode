using System.Text.Json.Serialization;

namespace backendApi.DTOs
{
    // Data sent back after login attempt.
    public class LoginResponse
    {
        public bool Success { get; set; }
        public required string Message { get; set; }
        [JsonIgnore]
        public string? Token { get; set; }
        public UserDto? User { get; set; }
    }
}