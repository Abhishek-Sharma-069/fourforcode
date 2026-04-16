using backendApi.DTOs;
using backendApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backendApi.Controllers;

// Prescription APIs: upload, read, and admin review.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PrescriptionsController(IPrescriptionService prescriptionService) : ControllerBase
{
    [HttpPost("upload")]
    // Uploads prescription file URL for a user.
    public async Task<IActionResult> Upload([FromBody] UploadPrescriptionRequest request)
    {
        var userId = this.GetAuthenticatedUserId();
        if (!userId.HasValue) return Unauthorized();
        if (!this.IsAdmin() && userId.Value != request.UserId) return Forbid();
        return Ok(await prescriptionService.UploadAsync(request));
    }

    [HttpGet("{userId:int}")]
    // Returns prescriptions of one user.
    public async Task<IActionResult> GetForUser(int userId)
    {
        var authUserId = this.GetAuthenticatedUserId();
        if (!authUserId.HasValue) return Unauthorized();
        if (!this.IsAdmin() && authUserId.Value != userId) return Forbid();
        return Ok(await prescriptionService.GetByUserAsync(userId));
    }

    [HttpPut("{id:int}/review")]
    [Authorize(Roles = "ADMIN")]
    // Admin approves/rejects prescription.
    public async Task<IActionResult> Review(int id, [FromBody] ReviewPrescriptionRequest request)
    {
        var reviewerId = this.GetAuthenticatedUserId();
        if (!reviewerId.HasValue) return Unauthorized();
        request.ReviewedBy = reviewerId.Value;
        var reviewed = await prescriptionService.ReviewAsync(id, request);
        return reviewed is null ? NotFound() : Ok(reviewed);
    }
}
