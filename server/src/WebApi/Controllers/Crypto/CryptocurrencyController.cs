using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.DTO.Crypto;
using Audex.Application.Interfaces.Crypto;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Crypto;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

namespace Audex.WebApi.Controllers.Crypto
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class CryptocurrencyController: ControllerBase
    {
        private readonly ICryptocurrencyService _cryptocurrencyService;
        private readonly WebApiMapper _mapper;

        public CryptocurrencyController(ICryptocurrencyService cryptocurrencyService, WebApiMapper mapper)
        {
            _mapper = mapper;
            _cryptocurrencyService = cryptocurrencyService;
        }

        [HttpGet]
        public async Task<IEnumerable<CryptocurrencyModel>> GetAll()
        {
            var cryptocurrencies = await _cryptocurrencyService.GetAllAsync();
            return _mapper.Map(cryptocurrencies);
        }

        [HttpPut]
        public async Task<CryptocurrencyModel> Add([FromForm] string cryptocurrencyJson, [FromForm] IFormFile cryptocurrencyIcon)
        {
            var cryptocurrency = JsonSerializer.Deserialize<CryptocurrencyModel>(cryptocurrencyJson);
            var cryptocurrencyDto = _mapper.Map(cryptocurrency);
            var result = await _cryptocurrencyService.AddAsync(cryptocurrencyDto, cryptocurrencyIcon);
            return _mapper.Map(result);
        }

        [HttpPatch]
        public async Task<CryptocurrencyModel> Update([FromForm] string cryptocurrencyJson, [FromForm] IFormFile cryptocurrencyIcon)
        {
            var cryptocurrency = JsonSerializer.Deserialize<CryptocurrencyModel>(cryptocurrencyJson);
            var cryptocurrencyDto = _mapper.Map(cryptocurrency);
            var result = await _cryptocurrencyService.UpdateAsync(cryptocurrencyDto, cryptocurrencyIcon);
            return _mapper.Map(result);
        }

        [HttpDelete]
        public async Task Delete(Guid id) =>
            await _cryptocurrencyService.DeleteAsync(id);


        [HttpGet("Icon")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCryptocurrencyIcon(string iconKey)
        {
            var file = await _cryptocurrencyService.GetIconStreamAsync(iconKey);
            if (file == null)
            {
                return NotFound();
            }

            Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            return File(file.Stream, file.ContentType);
        }
    }
}
