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

        Task<Dictionary<string, SecurityTransactionsSummaryDto>> GetSummaryTillSpecificDateAsync(DateOnly date, Guid? brokerAccountId);

        Task<IEnumerable<SecurityTransactionsHistoryDto>> GetTransactionsHistoryAsync(Guid securityId);
        Task<(decimal BrokerCommissions, decimal StockExchangeCommissions, decimal TransactionTaxes)> GetCommissionsAndTaxesAsync(Guid? brokerAccountId = null);
        Task<Guid> AddAsync(SecurityTransactionDto securityTransaction);
        Task UpdateAsync(SecurityTransactionDto securityTransaction);
        Task DeleteAsync(Guid id);
    }
}

