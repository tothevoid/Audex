#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Constants;
using Audex.Application.DTO.Common;
using Audex.Application.DTO.Currencies;
using Audex.Application.Interfaces.Currencies;
using Audex.Application.Interfaces.Integrations.Currency;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Mappings;
using Audex.Application.Utilities.Currencies;
using Audex.Infrastructure.Entities.Currencies;
using Audex.Infrastructure.Interfaces.Database;

namespace Audex.Application.Services.Currencies
{
    public class CurrencyService : ICurrencyService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRepository<Currency> _currencyRepository;
        private readonly ApplicationMapper _mapper;
        private readonly ICurrencyGrabber _currencyGrabber;
        private readonly ILocalizationService _localizer;

        public CurrencyService(
            IUnitOfWork unitOfWork,
            ApplicationMapper mapper,
            ICurrencyGrabber currencyGrabber,
            ILocalizationService localizer)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _currencyGrabber = currencyGrabber;
            _localizer = localizer;
            _currencyRepository = unitOfWork.CreateRepository<Currency>();
        }

        public async Task<IEnumerable<CurrencyDto>> GetAllAsync()
        {
            var currencies = await _currencyRepository.GetAllAsync();
            return _mapper.Map(currencies);
        }

        public async Task<CurrencyDto> GetByIdAsync(Guid id)
        {
            var currency = await _currencyRepository.GetByIdAsync(id);
            return _mapper.Map(currency);
        }

        public async Task<CurrencyDto?> GetByNameAsync(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return null;
            }

            var normalizedName = CurrencyNormalizer.Normalize(name);
            var currency = await _currencyRepository.FindAsync(currencyEntity => currencyEntity.Name == normalizedName);
            return _mapper.Map(currency);
        }

        public async Task<int> SyncRatesAsync(CurrencyDto mainCurrency, CancellationToken cancellationToken = default)
        {
            var currencies = (await _currencyRepository.GetAllAsync(disableTracking: false)).ToList();
            var currencyNames = currencies.Select(currency => currency.Name).ToHashSet();

            var rates = await _currencyGrabber.GetRatesAsync(mainCurrency.Name, currencyNames, cancellationToken);

            var updatedCount = 0;
            foreach (var currency in currencies)
            {
                if (currency.Id == mainCurrency.Id)
                {
                    currency.Rate = 1;
                    continue;
                }

                if (rates.TryGetValue(currency.Name, out var rate))
                {
                    currency.Rate = rate;
                    updatedCount++;
                }
                else
                {
                    currency.Rate = 1;
                }
            }

            await _unitOfWork.CommitAsync();
            return updatedCount;
        }

        public async Task<OperationResultDto<Guid>> AddAsync(CurrencyDto currencyDto)
        {
            var validationError = await ValidateCurrencyAsync(currencyDto.Name);
            if (validationError != null)
            {
                return OperationResultDto<Guid>.Failure(validationError);
            }

            var normalizedName = CurrencyNormalizer.Normalize(currencyDto.Name);
            var currency = _mapper.Map(currencyDto);
            currency.Id = Guid.NewGuid();
            currency.Name = normalizedName;
            await _currencyRepository.AddAsync(currency);
            await _unitOfWork.CommitAsync();
            return OperationResultDto<Guid>.Success(currency.Id);
        }

        public async Task<OperationResultDto<bool>> UpdateAsync(CurrencyDto currencyDto)
        {
            var validationError = await ValidateCurrencyAsync(currencyDto.Name, currencyDto.Id);
            if (validationError != null)
            {
                return OperationResultDto<bool>.Failure(validationError);
            }

            var normalizedName = CurrencyNormalizer.Normalize(currencyDto.Name);
            var currency = _mapper.Map(currencyDto);
            currency.Name = normalizedName;
            _currencyRepository.Update(currency);
            await _unitOfWork.CommitAsync();
            return OperationResultDto<bool>.Success(true);
        }

        private async Task<string?> ValidateCurrencyAsync(string? name, Guid? currentId = null)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return await _localizer.GetForUserAsync(LocalizationKeys.Currencies.CurrencyNameEmpty);
            }

            var normalizedName = CurrencyNormalizer.Normalize(name);
            var existingCurrency = await _currencyRepository
                .FindAsync(currencyEntity => currencyEntity.Name == normalizedName);

            if (existingCurrency != null && existingCurrency.Id != currentId)
            {
                return await _localizer.GetForUserAsync(
                    LocalizationKeys.Currencies.CurrencyAlreadyExists,
                    null,
                    normalizedName);
            }

            return null;
        }

        public async Task DeleteAsync(Guid id)
        {
            await _currencyRepository.DeleteAsync(id);
            await _unitOfWork.CommitAsync();
        }
    }
}
