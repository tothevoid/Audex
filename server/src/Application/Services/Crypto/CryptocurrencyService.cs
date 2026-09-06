using Audex.Infrastructure.Interfaces.Database;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.DTO.Crypto;
using Audex.Application.DTO.Currencies;
using Audex.Application.DTO.FileStorage;
using Audex.Application.Interfaces.Crypto;
using Audex.Application.Interfaces.Currencies;
using Audex.Application.Interfaces.Integrations.Crypto;
using Audex.Application.Mappings;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.Crypto;
using Audex.Application.Interfaces.FileStorage;
using Audex.Infrastructure.Interfaces.Messages;
using Microsoft.AspNetCore.Http;

namespace Audex.Application.Services.Crypto
{
    public class CryptocurrencyService : ICryptocurrencyService
    {
        private readonly IUnitOfWork _db;
        private readonly IRepository<Cryptocurrency> _cryptocurrencyRepo;
        private readonly ApplicationMapper _mapper;
        private readonly IFileStorageService _fileStorageService;
        private readonly ICurrencyService _currencyService;
        private readonly ICryptoConnector _cryptoConnector;
        private readonly IServerNotifier _serverNotifier;
        private const string _iconsBucket = "cryptocurrency";

        public CryptocurrencyService(
            IUnitOfWork uow,
            ApplicationMapper mapper,
            IFileStorageService fileStorageService,
            ICurrencyService currencyService,
            ICryptoConnector cryptoConnector,
            IServerNotifier serverNotifier = null)
        {
            _db = uow;
            _mapper = mapper;
            _cryptocurrencyRepo = uow.CreateRepository<Cryptocurrency>();
            _fileStorageService = fileStorageService;
            _currencyService = currencyService;
            _cryptoConnector = cryptoConnector;
            _serverNotifier = serverNotifier;
        }

        public async Task<CurrencyDto> GetBaseCurrencyAsync()
        {
            var currency = await _currencyService.GetByIdAsync(CurrencyConstants.USD);
            if (currency == null)
            {
                throw new InvalidOperationException("Base cryptocurrency currency (USD) was not found.");
            }

            if (currency.Rate <= 0)
            {
                currency.Rate = 1.0m;
            }

            return currency;
        }

        public async Task<IEnumerable<CryptocurrencyDto>> GetAllAsync()
        {
            var cryptocurrencies = await _cryptocurrencyRepo.GetAllAsync();
            return _mapper.Map(cryptocurrencies);
        }

        public async Task<CryptocurrencyDto> AddAsync(CryptocurrencyDto cryptocurrencyDto, IFormFile cryptocurrencyIcon)
        {
            if (cryptocurrencyDto == null || string.IsNullOrWhiteSpace(cryptocurrencyDto.Symbol))
            {
                throw new ArgumentException("Cryptocurrency symbol is required.");
            }

            var normalizedSymbol = cryptocurrencyDto.Symbol.Trim().ToUpperInvariant();

            var coinInfo = await _cryptoConnector.GetCoinInfoBySymbolAsync(normalizedSymbol);
            if (coinInfo == null)
            {
                throw new InvalidOperationException($"Cryptocurrency with symbol '{normalizedSymbol}' was not found on CoinGecko or has no price.");
            }

            var cryptocurrency = _mapper.Map(cryptocurrencyDto);
            cryptocurrency.Id = Guid.NewGuid();
            cryptocurrency.Symbol = normalizedSymbol;
            cryptocurrency.Name = coinInfo.Value.Name;
            cryptocurrency.Price = coinInfo.Value.PriceUsd;

            if (cryptocurrencyIcon != null)
            {
                var key = $"{cryptocurrency.Id}_{Guid.NewGuid():N}";
                await _fileStorageService.UploadFileAsync(_iconsBucket, cryptocurrencyIcon, key);
                cryptocurrency.IconKey = key;
            }

            await _cryptocurrencyRepo.AddAsync(cryptocurrency);
            await _db.CommitAsync();
            return _mapper.Map(cryptocurrency);
        }

        public async Task<CryptocurrencyDto> UpdateAsync(CryptocurrencyDto cryptocurrencyDto, IFormFile cryptocurrencyIcon)
        {
            if (cryptocurrencyDto == null || string.IsNullOrWhiteSpace(cryptocurrencyDto.Symbol))
            {
                throw new ArgumentException("Cryptocurrency symbol is required.");
            }

            var normalizedSymbol = cryptocurrencyDto.Symbol.Trim().ToUpperInvariant();

            var existingCrypto = await _cryptocurrencyRepo.GetByIdAsync(cryptocurrencyDto.Id);
            if (existingCrypto == null)
            {
                throw new InvalidOperationException($"Cryptocurrency with id '{cryptocurrencyDto.Id}' not found.");
            }

            var coinInfo = await _cryptoConnector.GetCoinInfoBySymbolAsync(normalizedSymbol);
            if (coinInfo == null)
            {
                throw new InvalidOperationException($"Cryptocurrency with symbol '{normalizedSymbol}' was not found on CoinGecko or has no price.");
            }

            var cryptocurrency = _mapper.Map(cryptocurrencyDto);
            cryptocurrency.Symbol = normalizedSymbol;
            cryptocurrency.Name = coinInfo.Value.Name;
            cryptocurrency.Price = coinInfo.Value.PriceUsd;

            if (cryptocurrencyIcon != null)
            {
                cryptocurrency.IconKey = $"{cryptocurrency.Id}_{Guid.NewGuid():N}";
                await _fileStorageService.UploadFileAsync(_iconsBucket, cryptocurrencyIcon, cryptocurrency.IconKey);
            }
            else if (string.IsNullOrEmpty(cryptocurrencyDto.IconKey))
            {
                cryptocurrency.IconKey = null;
            }

            if (!string.IsNullOrEmpty(existingCrypto?.IconKey) && existingCrypto.IconKey != cryptocurrency.IconKey)
            {
                await _fileStorageService.DeleteFileAsync(_iconsBucket, existingCrypto.IconKey);
            }

            _cryptocurrencyRepo.Update(cryptocurrency);
            await _db.CommitAsync();
            return _mapper.Map(cryptocurrency);
        }

        public async Task DeleteAsync(Guid id)
        {
            var crypto = await _cryptocurrencyRepo.GetByIdAsync(id);
            if (crypto != null && !string.IsNullOrEmpty(crypto.IconKey))
            {
                await _fileStorageService.DeleteFileAsync(_iconsBucket, crypto.IconKey);
            }

            await _cryptocurrencyRepo.DeleteAsync(id);
            await _db.CommitAsync();
        }

        public async Task<FileStreamDto> GetIconStreamAsync(string iconKey)
        {
            return await _fileStorageService.GetFileStreamAsync(_iconsBucket, iconKey);
        }

        public async Task<string> GetIconUrlAsync(string iconKey)
        {
            return await _fileStorageService.GetFileUrlAsync(_iconsBucket, iconKey);
        }

        public async Task<int> PullPricesAsync(CancellationToken cancellationToken = default)
        {
            var entities = (await _cryptocurrencyRepo.GetAllAsync(disableTracking: false)).ToList();
            if (entities.Count == 0)
            {
                return 0;
            }

            var dtos = _mapper.Map(entities);
            var prices = (await _cryptoConnector.GetPricesAsync(dtos, cancellationToken)).ToList();
            if (prices.Count == 0)
            {
                return 0;
            }

            var pricesById = prices
                .GroupBy(p => p.CryptocurrencyId)
                .ToDictionary(g => g.Key, g => g.Last().PriceUsd);

            var updatedCount = 0;
            foreach (var entity in entities)
            {
                if (pricesById.TryGetValue(entity.Id, out var newPrice) && newPrice > 0)
                {
                    entity.Price = newPrice;
                    _cryptocurrencyRepo.Update(entity);
                    updatedCount++;
                }
            }

            if (updatedCount > 0)
            {
                await _db.CommitAsync();
            }

            return updatedCount;
        }
    }
}
