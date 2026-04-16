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

    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    // Accepts an image file upload and creates prescription record.
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        var userId = this.GetAuthenticatedUserId();
        if (!userId.HasValue) return Unauthorized();

        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded." });

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf" };
        if (!allowedTypes.Contains(file.ContentType.ToLowerInvariant()))
            return BadRequest(new { message = "Only JPEG, PNG, WebP, GIF images and PDF files are allowed." });

        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(new { message = "File size must be under 10 MB." });

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"rx_{userId.Value}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";

        var prescription = await prescriptionService.UploadAsync(new UploadPrescriptionRequest
        {
            UserId = userId.Value,
            FileUrl = fileUrl
        });

        return Ok(prescription);
    }
}
