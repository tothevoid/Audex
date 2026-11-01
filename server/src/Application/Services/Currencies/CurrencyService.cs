using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.DTO.Currencies;
using Audex.Application.Interfaces.Currencies;
using Audex.Application.Interfaces.Integrations.Currency;
using Audex.Application.Mappings;
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

        public CurrencyService(
            IUnitOfWork unitOfWork,
            ApplicationMapper mapper,
            ICurrencyGrabber currencyGrabber)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _currencyRepository = unitOfWork.CreateRepository<Currency>();
            _currencyGrabber = currencyGrabber;
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

        public async Task UpdateAsync(CurrencyDto currencyDto)
        {
            var currency = _mapper.Map(currencyDto);
            _currencyRepository.Update(currency);
            await _unitOfWork.CommitAsync();
        }

        public async Task<Guid> AddAsync(CurrencyDto currencyDto)
        {
            var currency = _mapper.Map(currencyDto);
            currency.Id = Guid.NewGuid();
            await _currencyRepository.AddAsync(currency);
            await _unitOfWork.CommitAsync();
            return currency.Id;
        }

        public async Task DeleteAsync(Guid id)
        {
            await _currencyRepository.DeleteAsync(id);
            await _unitOfWork.CommitAsync();
        }
    }
}
