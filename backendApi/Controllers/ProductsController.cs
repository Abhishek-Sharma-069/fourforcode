using backendApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace backendApi.Controllers;

// Product APIs for listing medicine products.
[ApiController]
[Route("api/[controller]")]
public class ProductsController(IProductService productService) : ControllerBase
{
    [HttpGet]
    // Returns all products.
    public async Task<IActionResult> GetProducts() => Ok(await productService.GetProductsAsync());

    [HttpGet("{id:int}")]
    // Returns one product by numeric id.
    public async Task<IActionResult> GetProduct(int id)
    {
        var item = await productService.GetProductAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}
