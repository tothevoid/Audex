using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.DTO.Securities;

namespace Audex.Application.Interfaces.Securities
{
    public interface ISecurityPriceHistoryService
    {
        Task<int> SyncActiveSecuritiesPriceHistoryAsync(CancellationToken cancellationToken = default);

        Task EnsureSecurityPricesLoadedAsync(
            IEnumerable<SecurityDto> securities,
            DateOnly? startDate = null,
            DateOnly? endDate = null,
            CancellationToken cancellationToken = default);

        Task<IEnumerable<SecurityPriceHistoryDto>> GetPriceHistoriesAsync(
            IEnumerable<Guid> securityIds,
            DateOnly startDate,
            DateOnly endDate);

        Task<Dictionary<Guid, decimal>> GetPriceMapTillDateAsync(
            IEnumerable<Guid> securityIds,
            DateOnly date);
    }
}
