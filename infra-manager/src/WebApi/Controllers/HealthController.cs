using Microsoft.AspNetCore.Mvc;

namespace InfrastructureManager.WebApi.Controllers
{
    [ApiController]
    [Route("health")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult CheckHealth()
        {
            return Ok(new { status = "Healthy" });
        }
    }
}
