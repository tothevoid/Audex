using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.Accounts;

namespace Audex.Application.Interfaces.Accounts
{
    public interface IAccountService
    {
        Task<IEnumerable<AccountDto>> GetAllAsync(bool onlyActive = false, Guid? currencyId = null, Guid? accountTypeId = null);
        Task<IEnumerable<AccountDto>> GetAllByTypesAsync(Guid[] typesIds, bool onlyActive);
        Task<AccountDto> GetByIdAsync(Guid id);
        Task<Guid> AddAsync(AccountDto transaction);
        Task UpdateAsync(AccountDto accountDto);
        Task DeleteAsync(Guid id);
        Task TransferAsync(AccountTransferDto transferDto);
        Task<AccountCurrencySummaryDto[]> GetSummaryAsync();
    }
}