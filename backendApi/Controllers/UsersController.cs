using backendApi.DTOs;
using backendApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace backendApi.Controllers
{
    // This controller handles user account APIs like register and login.
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
        // Creates a new user account.
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
        // Verifies user credentials and sets secure auth cookie.
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

        [HttpPost("logout")]
        // Clears the secure auth cookie to log the user out.
        public IActionResult Logout()
        {
            Response.Cookies.Delete("auth_token", new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax
            });
            return Ok();
        }
    }
}
