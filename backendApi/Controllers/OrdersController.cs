using backendApi.DTOs;
using backendApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Place([FromBody] PlaceOrderRequest request) => Ok(await orderService.PlaceOrderAsync(request));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var order = await orderService.GetByIdAsync(id);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpGet("user/{id:int}")]
    public async Task<IActionResult> GetForUser(int id) => Ok(await orderService.GetByUserAsync(id));

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await orderService.UpdateStatusAsync(id, request);
        return order is null ? NotFound() : Ok(order);
    }
}
