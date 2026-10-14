using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Audex.Application.DTO.Crypto;
using Audex.Application.Interfaces.Crypto;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Crypto;
using Microsoft.AspNetCore.Authorization;

namespace Audex.WebApi.Controllers.Crypto
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class CryptoProviderController: ControllerBase
    {
        private readonly ICryptoProviderService _cryptoProviderService;
        private readonly WebApiMapper _mapper;
        public CryptoProviderController(ICryptoProviderService cryptoProviderService, WebApiMapper mapper)
        {
            _mapper = mapper;
            _cryptoProviderService = cryptoProviderService;
        }

        [HttpGet]
        public async Task<IEnumerable<CryptoProviderModel>> GetAll()
        {
            var cryptoProviders = await _cryptoProviderService.GetAllAsync();
            return _mapper.Map(cryptoProviders);
        }

        [HttpPut]
        public async Task<CryptoProviderModel> Add([FromForm] string cryptoProviderJson, [FromForm] IFormFile cryptoProviderIcon = null)
        {
            var cryptoProvider = JsonSerializer.Deserialize<CryptoProviderModel>(cryptoProviderJson);

            var cryptoProviderDto = _mapper.Map(cryptoProvider);
            var createdCryptoProvider = await _cryptoProviderService.AddAsync(cryptoProviderDto, cryptoProviderIcon);
            return _mapper.Map(createdCryptoProvider);
        }

        [HttpPatch]
        public async Task<CryptoProviderModel> Update([FromForm] string cryptoProviderJson, [FromForm] IFormFile cryptoProviderIcon = null)
        {
            var cryptoProvider = JsonSerializer.Deserialize<CryptoProviderModel>(cryptoProviderJson);

            var cryptoProviderDto = _mapper.Map(cryptoProvider);
            var updatedCryptoProvider = await _cryptoProviderService.UpdateAsync(cryptoProviderDto, cryptoProviderIcon);
            return _mapper.Map(updatedCryptoProvider);
        }

        [HttpDelete]
        public async Task Delete(Guid id) =>
            await _cryptoProviderService.DeleteAsync(id);

        [HttpGet("Icon")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCryptoProviderIcon(string iconKey)
        {
            var file = await _cryptoProviderService.GetIconStreamAsync(iconKey);
            if (file == null)
            {
                return NotFound();
            }

            Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            return File(file.Stream, file.ContentType);
        }
    }
}
