#nullable enable
using Microsoft.AspNetCore.Http;
using Audex.Application.DTO.FileStorage;
using Audex.Application.DTO.Securities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Securities
{
    public interface ISecurityService
    {
        Task<IEnumerable<SecurityDto>> GetAllAsync(bool disableTracking = true);
        Task<SecurityDto> FindByTickerAsync(string ticker);
        Task<SecurityDto?> FindByIsinAsync(string isin);
        Task<MarketSecurityInfoDto?> SearchMarketAsync(string query);

        Task<IEnumerable<SecurityDto>> FindByTickersAsync(IEnumerable<string> tickers);

        Task<SecurityDto> GetByIdAsync(Guid id, bool loadHierarchy = true, bool disableTracking = true);
        Task<SecurityStatsDto> GetStatsAsync(Guid securityId);
        Task<SecurityHistoryDto> GetTickerHistoryAsync(string ticker, SecurityHistoryPeriod period = SecurityHistoryPeriod.Day1);
        Task<SecurityDto> AddAsync(SecurityDto security, IFormFile securityIcon);
        Task<SecurityDto> UpdateAsync(SecurityDto security, IFormFile securityIcon);
        Task<FileStreamDto> GetIconStreamAsync(string iconKey);
        Task<string> GetIconUrlAsync(string iconKey);
        Task DeleteAsync(Guid id);
    }
}
