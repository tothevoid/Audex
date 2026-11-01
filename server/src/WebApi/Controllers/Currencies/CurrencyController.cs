using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using System;
using Audex.Application.DTO.Currencies;
using Audex.Application.Interfaces.Currencies;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Currencies;
using Audex.Application.Interfaces.User;
using Audex.Application.Services.User;
using Microsoft.AspNetCore.Authorization;

namespace Audex.WebApi.Controllers.Currencies
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class CurrencyController : ControllerBase
    {
        private readonly ICurrencyService _currencyService;
        private readonly WebApiMapper _mapper;
        private readonly IUserProfileService _userProfileService;

        public CurrencyController(ICurrencyService currencyService, WebApiMapper mapper, IUserProfileService userProfileService)
        {
            _mapper = mapper;
            _currencyService = currencyService;
            _userProfileService = userProfileService;
        }

        [HttpGet("SyncRates")]
        public async Task SyncRates(CancellationToken cancellationToken = default)
        {
            var profile = await _userProfileService.GetAsync();
            await _currencyService.SyncRatesAsync(profile.Currency, cancellationToken);
        }

        [HttpGet]
        public async Task<IEnumerable<CurrencyModel>> GetAll()
        {
            var currencies = await _currencyService.GetAllAsync();
            return _mapper.Map(currencies);
        }

        [HttpPut]
        public async Task<Guid> Add(CurrencyModel currency)
        {
            var currencyDto = _mapper.Map(currency);
            return await _currencyService.AddAsync(currencyDto);
        }

        [HttpPatch]
        public async Task Update(CurrencyModel currency)
        {
            var currencyDto = _mapper.Map(currency);
            await _currencyService.UpdateAsync(currencyDto);
        }

        [HttpDelete]
        public async Task Delete(Guid id) =>
            await _currencyService.DeleteAsync(id);
    }
}
