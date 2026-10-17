using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.DTO.Brokers;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Brokers;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.WebApi.Controllers.Brokers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class BrokerAccountPortfolioHistoryController : ControllerBase
    {
        private readonly IBrokerAccountPortfolioHistoryService _brokerAccountPortfolioHistoryService;

        public BrokerAccountPortfolioHistoryController(IBrokerAccountPortfolioHistoryService brokerAccountPortfolioHistoryService)
        {
            _brokerAccountPortfolioHistoryService = brokerAccountPortfolioHistoryService;
        }

        [HttpGet(nameof(GetAll))]
        public async Task<BrokerAccountPortfolioTimelinePointDto> GetAll([FromQuery] DateOnly date)
        {
            return await _brokerAccountPortfolioHistoryService.GetHistoryAsync(AdjustDate(date));
        }

        [HttpGet(nameof(GetByBrokerAccount))]
        public async Task<BrokerAccountPortfolioTimelinePointDto> GetByBrokerAccount([FromQuery] DateOnly date, [FromQuery] Guid brokerAccountId)
        {
            return await _brokerAccountPortfolioHistoryService.GetHistoryAsync(AdjustDate(date), brokerAccountId);
        }

        [HttpGet(nameof(GetDateBounds))]
        public async Task<BrokerAccountPortfolioDateBoundsDto> GetDateBounds([FromQuery] Guid? brokerAccountId = null)
        {
            return await _brokerAccountPortfolioHistoryService.GetDateBoundsAsync(brokerAccountId);
        }

        [HttpGet(nameof(GetRange))]
        public async Task<IEnumerable<BrokerAccountPortfolioTimelinePointDto>> GetRange(
            [FromQuery] BrokerAccountPortfolioRangeFilterDto filter)
        {
            return await _brokerAccountPortfolioHistoryService.GetRangeHistoryAsync(
                filter.StartDate,
                filter.EndDate,
                filter.BrokerAccountId);
        }

        [HttpGet(nameof(GetRangeByBrokerAccount))]
        public Task<IEnumerable<BrokerAccountPortfolioTimelinePointDto>> GetRangeByBrokerAccount(
            [FromQuery] BrokerAccountPortfolioRangeFilterDto filter)
        {
            return GetRange(filter);
        }

        private DateOnly AdjustDate(DateOnly date)
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            return date > today ? today : date;
        }
    }
}
