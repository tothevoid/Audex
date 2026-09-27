using Audex.Application.DTO.Transactions;
using Audex.Shared.Common;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Transactions
{
    public interface ICurrencyTransactionService
    {
        Task<PagedResult<CurrencyTransactionDto>> GetAllAsync(CurrencyTransactionFilterDto filter);
        Task<Guid> AddAsync(CurrencyTransactionDto currencyTransactionDto);
        Task UpdateAsync(CurrencyTransactionDto currencyTransactionDto);
        Task DeleteAsync(Guid id);
        Task<CurrencyTransactionDto> GetByIdAsync(Guid id);
        Task<CurrencyAccountSummaryDto> GetSummaryByAccountIdAsync(Guid accountId);
    }
}
