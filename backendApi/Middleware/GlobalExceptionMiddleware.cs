using System.Text.Json;

namespace backendApi.Middleware;

// Catches unhandled exceptions globally and returns safe JSON errors.
public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    // This runs for every request.
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            // Log real error in backend logs.
            logger.LogError(ex, "Unhandled exception");
            // Send readable status/message back to frontend.
            context.Response.StatusCode = ex is InvalidOperationException ? StatusCodes.Status400BadRequest : StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { message = ex.Message }));
        }
    }
}
