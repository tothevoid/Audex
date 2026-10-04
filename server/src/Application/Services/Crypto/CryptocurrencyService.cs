using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.Constants;
using Audex.Application.DTO.Common;
using Audex.Application.DTO.Crypto;
using Audex.Application.DTO.Currencies;
using Audex.Application.DTO.FileStorage;
using Audex.Application.Interfaces.Crypto;
using Audex.Application.Interfaces.Currencies;
using Audex.Application.Interfaces.FileStorage;
using Audex.Application.Interfaces.Integrations.Crypto;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Mappings;
using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.Crypto;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Interfaces.Messages;
using Microsoft.AspNetCore.Http;

namespace Audex.Application.Services.Crypto
{
    public class CryptocurrencyService : ICryptocurrencyService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IRepository<Cryptocurrency> _cryptocurrencyRepo;
        private readonly ApplicationMapper _mapper;
        private readonly IFileStorageService _fileStorageService;
        private readonly ICurrencyService _currencyService;
        private readonly ICryptoConnector _cryptoConnector;
        private readonly IServerNotifier _serverNotifier;
        private readonly ILocalizationService _localizer;
        private const string _iconsBucket = "cryptocurrency";

        public CryptocurrencyService(
            IUnitOfWork unitOfWork,
            ApplicationMapper mapper,
            IFileStorageService fileStorageService,
            ICurrencyService currencyService,
            ICryptoConnector cryptoConnector,
            ILocalizationService localizer,
            IServerNotifier serverNotifier = null)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _cryptocurrencyRepo = unitOfWork.CreateRepository<Cryptocurrency>();
            _fileStorageService = fileStorageService;
            _currencyService = currencyService;
            _cryptoConnector = cryptoConnector;
            _localizer = localizer;
            _serverNotifier = serverNotifier;
        }

        public async Task<CurrencyDto> GetBaseCurrencyAsync()
        {
            var currency = await _currencyService.GetByIdAsync(CurrencyConstants.USD);
            if (currency == null)
            {
                throw new InvalidOperationException(_localizer.Get(LocalizationKeys.Crypto.Errors.BaseCurrencyNotFound));
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
                throw new ArgumentException(_localizer.Get(LocalizationKeys.Crypto.Errors.SymbolRequired));
            }

            var normalizedSymbol = cryptocurrencyDto.Symbol.Trim().ToUpperInvariant();

            var coinResponse = await _cryptoConnector.GetCoinBySymbolAsync(normalizedSymbol);
            if (!coinResponse.IsSuccess || coinResponse.Data == null)
            {
                throw new InvalidOperationException(_localizer.Get(LocalizationKeys.Crypto.Errors.SymbolNotFound, normalizedSymbol));
            }

            var coinInfo = coinResponse.Data;

            var cryptocurrency = _mapper.Map(cryptocurrencyDto);
            cryptocurrency.Id = Guid.NewGuid();
            cryptocurrency.Symbol = normalizedSymbol;
            cryptocurrency.Name = coinInfo.Name;
            cryptocurrency.Price = coinInfo.PriceUsd;

            if (cryptocurrencyIcon != null)
            {
                var key = $"{cryptocurrency.Id}_{Guid.NewGuid():N}";
                await _fileStorageService.UploadFileAsync(_iconsBucket, cryptocurrencyIcon, key);
                cryptocurrency.IconKey = key;
            }

            await _cryptocurrencyRepo.AddAsync(cryptocurrency);
            await _unitOfWork.CommitAsync();
            return _mapper.Map(cryptocurrency);
        }

        public async Task<CryptocurrencyDto> UpdateAsync(CryptocurrencyDto cryptocurrencyDto, IFormFile cryptocurrencyIcon)
        {
            if (cryptocurrencyDto == null || string.IsNullOrWhiteSpace(cryptocurrencyDto.Symbol))
            {
                throw new ArgumentException(_localizer.Get(LocalizationKeys.Crypto.Errors.SymbolRequired));
            }

            var normalizedSymbol = cryptocurrencyDto.Symbol.Trim().ToUpperInvariant();

            var existingCrypto = await _cryptocurrencyRepo.GetByIdAsync(cryptocurrencyDto.Id);
            if (existingCrypto == null)
            {
                throw new InvalidOperationException(_localizer.Get(LocalizationKeys.Errors.EntityNotFound));
            }

            var coinResponse = await _cryptoConnector.GetCoinBySymbolAsync(normalizedSymbol);
            if (!coinResponse.IsSuccess || coinResponse.Data == null)
            {
                throw new InvalidOperationException(_localizer.Get(LocalizationKeys.Crypto.Errors.SymbolNotFound, normalizedSymbol));
            }

            var coinInfo = coinResponse.Data;

            var cryptocurrency = _mapper.Map(cryptocurrencyDto);
            cryptocurrency.Symbol = normalizedSymbol;
            cryptocurrency.Name = coinInfo.Name;
            cryptocurrency.Price = coinInfo.PriceUsd;

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
            await _unitOfWork.CommitAsync();
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
            await _unitOfWork.CommitAsync();
        }

        public async Task<FileStreamDto> GetIconStreamAsync(string iconKey)
        {
            return await _fileStorageService.GetFileStreamAsync(_iconsBucket, iconKey);
        }

        public async Task<string> GetIconUrlAsync(string iconKey)
        {
            return await _fileStorageService.GetFileUrlAsync(_iconsBucket, iconKey);
        }

        public async Task<OperationResultDto<PullCryptoPricesResultDto>> PullPricesAsync(CancellationToken cancellationToken = default)
        {
            var entities = (await _cryptocurrencyRepo.GetAllAsync(disableTracking: false)).ToList();
            if (entities.Count == 0)
            {
                return OperationResultDto<PullCryptoPricesResultDto>.Success(new PullCryptoPricesResultDto
                {
                    UpdatedCount = 0,
                    TotalCount = 0
                });
            }

            var dtos = _mapper.Map(entities);
            var pullResponse = await _cryptoConnector.GetPricesAsync(dtos, cancellationToken);
            if (!pullResponse.IsSuccess || pullResponse.Data == null)
            {
                var errorMessage = await _localizer.GetForUserAsync(
                    LocalizationKeys.Crypto.Errors.ProviderUnavailable,
                    UserProfileConstants.UserProfileId);

                return OperationResultDto<PullCryptoPricesResultDto>.Failure(
                    errorMessage,
                    errorCode: "CRYPTO_PROVIDER_UNAVAILABLE");
            }

            if (pullResponse.Data.Count == 0)
            {
                var errorMessage = await _localizer.GetForUserAsync(
                    LocalizationKeys.Crypto.Errors.NoMatchingPricesFound,
                    UserProfileConstants.UserProfileId);

                return OperationResultDto<PullCryptoPricesResultDto>.Failure(
                    errorMessage,
                    errorCode: "NO_MATCHING_PRICES_FOUND");
            }

            var pricesById = pullResponse.Data
                .GroupBy(price => price.CryptocurrencyId)
                .ToDictionary(group => group.Key, group => group.Last().PriceUsd);

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
                await _unitOfWork.CommitAsync();
            }

            return OperationResultDto<PullCryptoPricesResultDto>.Success(new PullCryptoPricesResultDto
            {
                UpdatedCount = updatedCount,
                TotalCount = entities.Count
            });
        }
    }
}
