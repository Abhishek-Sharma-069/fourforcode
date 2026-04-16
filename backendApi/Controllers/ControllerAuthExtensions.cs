using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace backendApi.Controllers;

// Helper methods used by controllers to read logged-in user details safely.
internal static class ControllerAuthExtensions
{
    // Extract user id from JWT claims.
    public static int? GetAuthenticatedUserId(this ControllerBase controller)
    {
        var idClaim = controller.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? controller.User.FindFirst("sub")?.Value;
        return int.TryParse(idClaim, out var userId) ? userId : null;
    }

    // True when logged-in user has ADMIN role.
    public static bool IsAdmin(this ControllerBase controller) =>
        controller.User.IsInRole("ADMIN");
}
