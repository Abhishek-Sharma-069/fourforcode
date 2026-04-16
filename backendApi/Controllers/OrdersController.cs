using backendApi.DTOs;
using backendApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backendApi.Controllers;

// Order APIs: place order, get order details, list user's orders, update order status.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    [HttpPost]
    // Places a new order from cart.
    public async Task<IActionResult> Place([FromBody] PlaceOrderRequest request)
    {
        var userId = this.GetAuthenticatedUserId();
        if (!userId.HasValue) return Unauthorized();
        if (!this.IsAdmin() && userId.Value != request.UserId) return Forbid();
        return Ok(await orderService.PlaceOrderAsync(request));
    }

    [HttpGet("{id:int}")]
    // Gets one order by id.
    public async Task<IActionResult> Get(int id)
    {
        var userId = this.GetAuthenticatedUserId();
        if (!userId.HasValue) return Unauthorized();
        var order = await orderService.GetByIdAsync(id);
        if (order is null) return NotFound();
        if (!this.IsAdmin() && order.UserId != userId.Value) return Forbid();
        return Ok(order);
    }

    [HttpGet("user/{id:int}")]
    // Gets all orders for one user.
    public async Task<IActionResult> GetForUser(int id)
    {
        var userId = this.GetAuthenticatedUserId();
        if (!userId.HasValue) return Unauthorized();
        if (!this.IsAdmin() && userId.Value != id) return Forbid();
        return Ok(await orderService.GetByUserAsync(id));
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "ADMIN")]
    // Admin-only endpoint to move order to next delivery status.
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await orderService.UpdateStatusAsync(id, request);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpPut("{id:int}/cancel")]
    // Cancels an order by user or admin.
    public async Task<IActionResult> Cancel(int id)
    {
        var userId = this.GetAuthenticatedUserId();
        if (!userId.HasValue) return Unauthorized();
        var order = await orderService.CancelAsync(id, userId.Value, this.IsAdmin());
        return order is null ? NotFound() : Ok(order);
    }
}
