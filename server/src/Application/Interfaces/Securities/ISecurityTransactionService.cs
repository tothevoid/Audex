using Audex.Application.DTO.Securities;
using Audex.Shared.Common;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Securities
{
    public interface ISecurityTransactionService
    {
        Task<PagedResult<SecurityTransactionDto>> GetAllAsync(SecurityTransactionsFilterDto filter);
        Task<DateOnly?> GetEarliestDateAsync(Guid? brokerAccountId = null);
        Task<DateOnly?> GetEarliestDateBySecurityAsync(Guid securityId);
        Task<DateOnly?> GetLatestDateAsync(Guid? brokerAccountId = null);
        Task<IEnumerable<SecurityTransactionDto>> GetTillDateAsync(DateOnly date, Guid? brokerAccountId = null);
        Task<IEnumerable<Guid>> GetDistinctSecurityIdsAsync();

        Task<Dictionary<string, SecurityTransactionsSummaryDto>> GetSummaryTillSpecificDateAsync(DateOnly date, Guid? brokerAccountId);

        Task<IEnumerable<SecurityTransactionsHistoryDto>> GetTransactionsHistoryAsync(Guid securityId);
        Task<(decimal BrokerCommissions, decimal StockExchangeCommissions, decimal TransactionTaxes)> GetCommissionsAndTaxesAsync(Guid? brokerAccountId = null);
        Task<Guid> AddAsync(SecurityTransactionDto securityTransaction);
        Task UpdateAsync(SecurityTransactionDto securityTransaction);
        Task DeleteAsync(Guid id);
    }
}

