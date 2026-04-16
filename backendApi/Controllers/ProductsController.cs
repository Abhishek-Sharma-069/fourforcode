using backendApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace backendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(IProductService productService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetProducts() => Ok(await productService.GetProductsAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProduct(int id)
    {
        var item = await productService.GetProductAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
