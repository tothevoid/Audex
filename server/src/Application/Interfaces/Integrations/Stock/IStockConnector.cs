#nullable enable
using Audex.Application.DTO.Securities;
using Audex.Application.Integrations.Stock;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Audex.Application.Integrations.Stock.Moex.Model;

namespace Audex.Application.Interfaces.Integrations.Stock
{
    public interface IStockConnector
    {
        Task<IEnumerable<MarketDataRow>> GetValuesByTickersAsync(IEnumerable<SecurityDto> tickers);

        Task<IEnumerable<SecurityHistoryValueDto>> GetTickerHistoryAsync(SecurityDto security, DateOnly from, DateOnly to, int interval = 24);

        Task<IEnumerable<MarketDataRow>> GetExtendedValuesByTickersAsync(IEnumerable<SecurityDto> tickers);

        Task<IEnumerable<SecurityCandleDto>> GetCandlesAsync(SecurityDto security, DateOnly from, DateOnly to, int interval = 24);

        Task<MoexSecurityInfoDto?> FindSecurityInfoAsync(string query);
    }
}
