using Audex.Application.DTO.Securities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.Common;

namespace Audex.Application.Interfaces.Securities
{
    public interface ISecurityTransactionService
    {
        Task<IEnumerable<SecurityTransactionDto>> GetAllAsync(Guid? brokerAccountId, int recordsQuantity, int pageIndex);

        Task<Dictionary<string, SecurityTransactionsSummaryDto>> GetSummaryTillSpecificDateAsync(DateOnly date, Guid? brokerAccountId);

        Task<IEnumerable<SecurityTransactionsHistoryDto>> GetTransactionsHistoryAsync(Guid securityId);
        Task<PaginationConfigDto> GetPaginationAsync(Guid brokerAccountId);
        Task<PaginationConfigDto> GetPaginationAsync();
        Task<(decimal BrokerCommissions, decimal StockExchangeCommissions, decimal TransactionTaxes)> GetCommissionsAndTaxesAsync(Guid? brokerAccountId = null);
        Task<Guid> AddAsync(SecurityTransactionDto securityTransaction);
        Task UpdateAsync(SecurityTransactionDto securityTransaction);
        Task DeleteAsync(Guid id);
    }
}

