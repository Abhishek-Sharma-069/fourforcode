using backendApi.DTOs;
using backendApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backendApi.Controllers;

// Cart APIs: add items, read cart, update item quantity, remove item.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController(ICartService cartService) : ControllerBase
{
    [HttpPost("add")]
    // Adds a product into user's cart.
    public async Task<IActionResult> Add([FromBody] CartAddRequest request)
    {
        var userId = this.GetAuthenticatedUserId();
        if (!userId.HasValue) return Unauthorized();
        if (!this.IsAdmin() && userId.Value != request.UserId) return Forbid();
        return Ok(await cartService.AddToCartAsync(request));
    }

    [HttpGet("{userId:int}")]
    // Reads cart for one user.
    public async Task<IActionResult> Get(int userId)
    {
        var authUserId = this.GetAuthenticatedUserId();
        if (!authUserId.HasValue) return Unauthorized();
        if (!this.IsAdmin() && authUserId.Value != userId) return Forbid();
        return Ok(await cartService.GetCartAsync(userId));
    }

    [HttpPut("update")]
    // Changes quantity of an existing cart item.
    public async Task<IActionResult> Update([FromBody] CartUpdateRequest request)
    {
        var userId = this.GetAuthenticatedUserId();
        if (!userId.HasValue) return Unauthorized();
        if (!this.IsAdmin() && userId.Value != request.UserId) return Forbid();
        return Ok(await cartService.UpdateCartAsync(request));
    }

    [HttpDelete("remove")]
    // Deletes one product from cart.
    public async Task<IActionResult> Remove([FromBody] CartRemoveRequest request)
    {
        var userId = this.GetAuthenticatedUserId();
        if (!userId.HasValue) return Unauthorized();
        if (!this.IsAdmin() && userId.Value != request.UserId) return Forbid();
        return Ok(await cartService.RemoveFromCartAsync(request));
    }
}
