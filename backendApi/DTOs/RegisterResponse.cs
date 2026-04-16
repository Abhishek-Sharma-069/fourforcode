namespace backendApi.DTOs
{
    // Data sent back after register attempt.
    public class RegisterResponse
    {
        public bool Success { get; set; }
        public required string Message { get; set; }
        public UserDto? User { get; set; }
    }

    // Safe user info returned to frontend (no password hash here).
    public class UserDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string Role { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}