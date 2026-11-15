#nullable enable
using Audex.Application.DTO.Common;
using Audex.Application.DTO.Currencies;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Currencies
{
    public interface ICurrencyService
    {
        Task<int> SyncRatesAsync(CurrencyDto mainCurrency, CancellationToken cancellationToken = default);
        Task<IEnumerable<CurrencyDto>> GetAllAsync();
        Task<CurrencyDto> GetByIdAsync(Guid id);
        Task<CurrencyDto?> GetByNameAsync(string name);
        Task<OperationResultDto<Guid>> AddAsync(CurrencyDto currency);
        Task<OperationResultDto<bool>> UpdateAsync(CurrencyDto currency);
        Task DeleteAsync(Guid id);
    }
}