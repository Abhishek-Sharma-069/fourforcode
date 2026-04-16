using System.Text.Json.Serialization;

namespace backendApi.DTOs
{
    public class LoginResponse
    {
        public bool Success { get; set; }
        public required string Message { get; set; }
        [JsonIgnore]
        public string? Token { get; set; }
        public UserDto? User { get; set; }
    }
}