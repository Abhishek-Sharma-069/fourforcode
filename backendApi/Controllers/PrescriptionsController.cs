using backendApi.DTOs;
using backendApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PrescriptionsController(IPrescriptionService prescriptionService) : ControllerBase
{
    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromBody] UploadPrescriptionRequest request) => Ok(await prescriptionService.UploadAsync(request));

    [HttpGet("{userId:int}")]
    public async Task<IActionResult> GetForUser(int userId) => Ok(await prescriptionService.GetByUserAsync(userId));

    [HttpPut("{id:int}/review")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Review(int id, [FromBody] ReviewPrescriptionRequest request)
    {
        var reviewed = await prescriptionService.ReviewAsync(id, request);
        return reviewed is null ? NotFound() : Ok(reviewed);
    }
}
