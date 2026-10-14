using Audex.Application.DTO.Crypto;
using Audex.Application.Interfaces.Crypto;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Crypto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.WebApi.Controllers.Crypto
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class CryptoAssetController : ControllerBase
    {
        private readonly ICryptoAssetService _cryptoAssetService;
        private readonly WebApiMapper _mapper;

        public CryptoAssetController(ICryptoAssetService cryptoAssetService, WebApiMapper mapper)
        {
            _mapper = mapper;
            _cryptoAssetService = cryptoAssetService;
        }

        [HttpGet("GetByCryptoAccount")]
        public async Task<IEnumerable<CryptoAssetModel>> GetByCryptoAccountAsync(Guid cryptoAccountId)
        {
            var cryptoAssets = await _cryptoAssetService.GetByCryptoAccountAsync(cryptoAccountId);
            return _mapper.Map(cryptoAssets);
        }

        [HttpGet]
        public async Task<IEnumerable<CryptoAssetModel>> GetAllAsync()
        {
            var cryptoAssets = await _cryptoAssetService.GetAllAsync();
            return _mapper.Map(cryptoAssets);
        }

        [HttpGet("GetTotalBalanceByCryptoAccount")]
        public async Task<decimal> GetTotalBalanceByCryptoAccountAsync([FromQuery] Guid cryptoAccountId)
        {
            return await _cryptoAssetService.GetTotalBalanceByCryptoAccountAsync(cryptoAccountId);
        }

        [HttpGet("GetTotalBalance")]
        public async Task<decimal> GetTotalBalanceAsync()
        {
            return await _cryptoAssetService.GetTotalBalanceAsync();
        }

        [HttpPut]
        public async Task<Guid> AddAsync(CryptoAssetModel cryptoAssetModel)
        {
            var cryptoAssetDto = _mapper.Map(cryptoAssetModel);
            return await _cryptoAssetService.AddAsync(cryptoAssetDto);
        }

        [HttpPatch]
        public async Task UpdateAsync(CryptoAssetModel cryptoAssetModel)
        {
            var cryptoAssetDto = _mapper.Map(cryptoAssetModel);
            await _cryptoAssetService.UpdateAsync(cryptoAssetDto);
        }

        [HttpDelete]
        public async Task DeleteAsync(Guid id) =>
            await _cryptoAssetService.DeleteAsync(id);
    }
}
