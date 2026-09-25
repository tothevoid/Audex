#nullable enable
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Audex.Application.Constants;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.DTO.Common;
using Audex.Application.DTO.Securities;
using Audex.Application.Enums.Brokers;
using Audex.Application.Interfaces.Brokers.Statements;
using Audex.Application.Interfaces.Integrations.Stock;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Securities;
using Audex.Application.Mappings;
using Audex.Infrastructure.Entities.Securities;
using Audex.Infrastructure.Interfaces.Database;

namespace Audex.Application.Services.Brokers.Statements
{
    public class BrokerStatementImportService : IBrokerStatementImportService
    {
        private readonly IBrokerStatementImporterRegistry _importerRegistry;
        private readonly IBrokerStatementDiffEngine _diffEngine;
        private readonly ISecurityTransactionService _securityTransactionService;
        private readonly ISecurityService _securityService;
        private readonly IStockConnector _stockConnector;
        private readonly IRepository<SecurityTransaction> _securityTransactionRepo;
        private readonly ApplicationMapper _mapper;
        private readonly IBrokerStatementSessionCache _sessionCache;
        private readonly ILocalizationService _localizer;

        public BrokerStatementImportService(
            IBrokerStatementImporterRegistry importerRegistry,
            IBrokerStatementDiffEngine diffEngine,
            ISecurityTransactionService securityTransactionService,
            ISecurityService securityService,
            IStockConnector stockConnector,
            IUnitOfWork uow,
            ApplicationMapper mapper,
            IBrokerStatementSessionCache sessionCache,
            ILocalizationService localizer)
        {
            _importerRegistry = importerRegistry;
            _diffEngine = diffEngine;
            _securityTransactionService = securityTransactionService;
            _securityService = securityService;
            _stockConnector = stockConnector;
            _securityTransactionRepo = uow.CreateRepository<SecurityTransaction>();
            _mapper = mapper;
            _sessionCache = sessionCache;
            _localizer = localizer;
        }

        public IReadOnlyList<BrokerStatementImporterDto> GetImporters()
        {
            return _importerRegistry.GetAll();
        }

        public async Task<BrokerStatementAnalysisResultDto> AnalyzeAsync(
            Stream fileStream,
            Guid brokerAccountId,
            string importerId,
            string timeZoneId)
        {
            if (string.IsNullOrWhiteSpace(timeZoneId))
            {
                throw new ArgumentException("Time zone ID cannot be null or whitespace.", nameof(timeZoneId));
            }

            if (!_importerRegistry.TryGetById(importerId, out var importer) || importer == null)
            {
                throw new KeyNotFoundException($"Broker statement importer '{importerId}' was not found.");
            }

            var parsedTransactions = await importer.ParseAsync(fileStream, timeZoneId);
            var diffResult = await _diffEngine.ComputeDiffAsync(brokerAccountId, importerId, timeZoneId, parsedTransactions);

            var sessionId = Guid.NewGuid();
            diffResult.SessionId = sessionId;
            _sessionCache.SetSession(diffResult);

            return diffResult;
        }

        public async Task<OperationResultDto<ApplyStatementDiffsSummaryDto>> ApplyDiffsAsync(
            ApplyStatementDiffsRequestDto request)
        {
            if (request == null || request.SessionId == Guid.Empty)
            {
                return OperationResultDto<ApplyStatementDiffsSummaryDto>.Failure(
                    await _localizer.GetForUserAsync(LocalizationKeys.Errors.ValidationError));
            }

            if (!_sessionCache.TryGetSession(request.SessionId, out BrokerStatementAnalysisResultDto? session) || session == null)
            {
                return OperationResultDto<ApplyStatementDiffsSummaryDto>.Failure(
                    await _localizer.GetForUserAsync(LocalizationKeys.Statements.ImportSessionExpired),
                    "SESSION_EXPIRED");
            }

            if (request.SelectedDiffIds == null || request.SelectedDiffIds.Count == 0)
            {
                return OperationResultDto<ApplyStatementDiffsSummaryDto>.Success(new ApplyStatementDiffsSummaryDto
                {
                    BrokerAccountId = session.BrokerAccountId
                });
            }

            var selectedIdsSet = new HashSet<Guid>(request.SelectedDiffIds);
            var itemsToApply = session.DiffItems
                .Where(diffItem => selectedIdsSet.Contains(diffItem.Id))
                .ToList();
            try
            {
                var summary = await ProcessDiffItemsAsync(session.BrokerAccountId, itemsToApply);
                _sessionCache.RemoveSession(request.SessionId);

                return OperationResultDto<ApplyStatementDiffsSummaryDto>.Success(summary);
            }
            catch (Exception ex)
            {
                return OperationResultDto<ApplyStatementDiffsSummaryDto>.Failure(ex.Message);
            }
        }

        private async Task<ApplyStatementDiffsSummaryDto> ProcessDiffItemsAsync(
            Guid brokerAccountId,
            IReadOnlyList<BrokerStatementDiffItemDto> itemsToApply)
        {
            int createdTransactionsCount = 0;
            int updatedTransactionsCount = 0;
            int createdSecuritiesCount = 0;

            var securitiesCache = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
            var enrichedSecurityIds = new HashSet<Guid>();

            foreach (var item in itemsToApply)
            {
                var (securityId, wasCreated) = await ResolveOrEnrichSecurityAsync(
                    item,
                    securitiesCache,
                    enrichedSecurityIds);

                if (wasCreated)
                {
                    createdSecuritiesCount++;
                }

                if (item.StatementTransaction == null)
                {
                    continue;
                }

                var transaction = item.StatementTransaction;
                transaction.BrokerAccountId = brokerAccountId;

                if (item.DiffType == StatementDiffType.New)
                {
                    if (securityId == Guid.Empty)
                    {
                        continue;
                    }

                    transaction.SecurityId = securityId;
                    await _securityTransactionService.AddAsync(transaction);
                    createdTransactionsCount++;
                }
                else if (item.DiffType == StatementDiffType.FieldDiscrepancy && item.DatabaseTransaction != null)
                {
                    transaction.Id = item.DatabaseTransaction.Id;
                    transaction.SecurityId = securityId != Guid.Empty ? securityId : item.DatabaseTransaction.SecurityId;
                    await _securityTransactionService.UpdateAsync(transaction);
                    updatedTransactionsCount++;
                }
            }

            return new ApplyStatementDiffsSummaryDto
            {
                BrokerAccountId = brokerAccountId,
                CreatedTransactionsCount = createdTransactionsCount,
                UpdatedTransactionsCount = updatedTransactionsCount,
                CreatedSecuritiesCount = createdSecuritiesCount
            };
        }

        private async Task<(Guid SecurityId, bool WasCreated)> ResolveOrEnrichSecurityAsync(
            BrokerStatementDiffItemDto item,
            Dictionary<string, Guid> securitiesCache,
            HashSet<Guid> enrichedSecurityIds)
        {
            var existingSecurityId = item.StatementTransaction?.SecurityId ?? item.DatabaseTransaction?.SecurityId;
            if (existingSecurityId.HasValue && existingSecurityId.Value != Guid.Empty)
            {
                await EnrichSecurityIsinIfMissingAsync(existingSecurityId.Value, item.Isin, enrichedSecurityIds);
                return (existingSecurityId.Value, false);
            }

            var lookupKey = !string.IsNullOrWhiteSpace(item.Isin) ? item.Isin : item.Ticker;
            if (securitiesCache.TryGetValue(lookupKey, out var cachedSecurityId))
            {
                return (cachedSecurityId, false);
            }

            var existingSecurity = await FindSecurityInDatabaseAsync(item.Isin, item.Ticker);
            if (existingSecurity != null)
            {
                securitiesCache[lookupKey] = existingSecurity.Id;
                await EnrichSecurityIsinIfMissingAsync(existingSecurity.Id, item.Isin, enrichedSecurityIds);
                return (existingSecurity.Id, false);
            }

            var createdSecurityId = await CreateSecurityFromMarketAsync(item);
            if (createdSecurityId.HasValue)
            {
                securitiesCache[lookupKey] = createdSecurityId.Value;
                return (createdSecurityId.Value, true);
            }

            return (Guid.Empty, false);
        }

        private async Task<SecurityDto?> FindSecurityInDatabaseAsync(string? isin, string? ticker)
        {
            if (!string.IsNullOrWhiteSpace(isin))
            {
                var securityByIsin = await _securityService.FindByIsinAsync(isin);
                if (securityByIsin != null)
                {
                    return securityByIsin;
                }
            }

            if (!string.IsNullOrWhiteSpace(ticker))
            {
                return await _securityService.FindByTickerAsync(ticker);
            }

            return null;
        }

        private async Task<Guid?> CreateSecurityFromMarketAsync(BrokerStatementDiffItemDto item)
        {
            var query = !string.IsNullOrWhiteSpace(item.Isin) ? item.Isin : item.Ticker;
            if (string.IsNullOrWhiteSpace(query))
            {
                return null;
            }

            var marketInfo = await _securityService.SearchMarketAsync(query);
            if (marketInfo == null)
            {
                return null;
            }

            var newSecurity = new SecurityDto
            {
                Ticker = marketInfo.Ticker,
                Name = !string.IsNullOrWhiteSpace(marketInfo.Name) ? marketInfo.Name : item.SecurityName,
                Isin = marketInfo.Isin ?? item.Isin,
                TypeId = marketInfo.TypeId,
                CurrencyId = marketInfo.CurrencyId,
                ActualPrice = marketInfo.LastPrice ?? item.StatementTransaction?.Price ?? item.DatabaseTransaction?.Price ?? 0m,
                PriceFetchedAt = DateTime.UtcNow
            };

            var creationResult = await _securityService.AddAsync(newSecurity, null);
            return creationResult.IsSuccess && creationResult.Data != null
                ? creationResult.Data.Id
                : null;
        }

        private async Task EnrichSecurityIsinIfMissingAsync(
            Guid securityId,
            string? isin,
            HashSet<Guid> enrichedSecurityIds)
        {
            if (string.IsNullOrWhiteSpace(isin) || !enrichedSecurityIds.Add(securityId))
            {
                return;
            }

            var existingSecurity = await _securityService.GetByIdAsync(securityId);
            if (existingSecurity != null && string.IsNullOrWhiteSpace(existingSecurity.Isin))
            {
                existingSecurity.Isin = isin;
                await _securityService.UpdateAsync(existingSecurity, null);
            }
        }
    }
}
