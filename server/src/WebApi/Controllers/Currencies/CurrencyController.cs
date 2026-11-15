#nullable enable
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Constants;
using Audex.Application.DTO.Common;
using Audex.Application.DTO.Currencies;
using Audex.Application.Interfaces.Currencies;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.User;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Currencies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

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
        private readonly ILocalizationService _localizer;

        public CurrencyController(
            ICurrencyService currencyService,
            WebApiMapper mapper,
            IUserProfileService userProfileService,
            ILocalizationService localizer)
        {
            _mapper = mapper;
            _currencyService = currencyService;
            _userProfileService = userProfileService;
            _localizer = localizer;
        }

        [HttpGet("SyncRates")]
        public async Task SyncRates(CancellationToken cancellationToken = default)
        {
            var profile = await _userProfileService.GetAsync();
            if (profile?.Currency == null)
            {
                return;
            }

            await _currencyService.SyncRatesAsync(profile.Currency, cancellationToken);
        }

        [HttpGet]
        public async Task<IEnumerable<CurrencyModel>> GetAll()
        {
            var currencies = await _currencyService.GetAllAsync();
            return _mapper.Map(currencies);
        }

        [HttpGet(nameof(GetByName))]
        public async Task<ActionResult<CurrencyModel>> GetByName([FromQuery] string? name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest();
            }

            var currency = await _currencyService.GetByNameAsync(name);
            if (currency == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map(currency));
        }

        [HttpPut]
        public async Task<OperationResultDto<Guid>> Add(CurrencyModel? currency)
        {
            if (currency == null)
            {
                var validationError = await _localizer.GetForUserAsync(LocalizationKeys.Errors.ValidationError);
                return OperationResultDto<Guid>.Failure(validationError);
            }

            if (string.IsNullOrWhiteSpace(currency.Name))
            {
                var emptyNameError = await _localizer.GetForUserAsync(LocalizationKeys.Currencies.CurrencyNameEmpty);
                return OperationResultDto<Guid>.Failure(emptyNameError);
            }

            var currencyDto = _mapper.Map(currency);
            return await _currencyService.AddAsync(currencyDto);
        }

        [HttpPatch]
        public async Task<OperationResultDto<bool>> Update(CurrencyModel? currency)
        {
            if (currency == null || currency.Id == Guid.Empty)
            {
                var validationError = await _localizer.GetForUserAsync(LocalizationKeys.Errors.ValidationError);
                return OperationResultDto<bool>.Failure(validationError);
            }

            if (string.IsNullOrWhiteSpace(currency.Name))
            {
                var emptyNameError = await _localizer.GetForUserAsync(LocalizationKeys.Currencies.CurrencyNameEmpty);
                return OperationResultDto<bool>.Failure(emptyNameError);
            }

            var currencyDto = _mapper.Map(currency);
            return await _currencyService.UpdateAsync(currencyDto);
        }

        [HttpDelete]
        public async Task Delete(Guid id)
        {
            if (id == Guid.Empty)
            {
                return;
            }

            await _currencyService.DeleteAsync(id);
        }
    }
}
