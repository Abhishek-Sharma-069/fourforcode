using backendApi.DTOs;
using backendApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController(ICartService cartService) : ControllerBase
{
    [HttpPost("add")]
    public async Task<IActionResult> Add([FromBody] CartAddRequest request) => Ok(await cartService.AddToCartAsync(request));

    [HttpGet("{userId:int}")]
    public async Task<IActionResult> Get(int userId) => Ok(await cartService.GetCartAsync(userId));

    [HttpPut("update")]
    public async Task<IActionResult> Update([FromBody] CartUpdateRequest request) => Ok(await cartService.UpdateCartAsync(request));

    [HttpDelete("remove")]
    public async Task<IActionResult> Remove([FromBody] CartRemoveRequest request) => Ok(await cartService.RemoveFromCartAsync(request));
}
