using backendApi.DTOs;
using backendApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace backendApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<RegisterResponse>> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _userService.RegisterAsync(request);
            
            if (!response.Success)
            {
                return BadRequest(response);
            }

            return CreatedAtAction(nameof(Register), response);
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _userService.LoginAsync(request);

            if (!response.Success)
            {
                return Unauthorized(response);
            }

            if (!string.IsNullOrWhiteSpace(response.Token))
            {
                Response.Cookies.Append("auth_token", response.Token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = Request.IsHttps,
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTimeOffset.UtcNow.AddDays(7),
                    IsEssential = true
                });
            }

            return Ok(response);
        }
    }
}
