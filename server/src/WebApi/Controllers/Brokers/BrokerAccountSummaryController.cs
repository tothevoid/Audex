using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System;
using Audex.Application.DTO.Brokers;
using Audex.Application.Interfaces.Brokers;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Brokers;
using Microsoft.AspNetCore.Authorization;

namespace Audex.WebApi.Controllers.Brokers
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class BrokerAccountSummaryController : ControllerBase
    {
        private readonly IBrokerAccountSummaryService _brokerAccountSummaryService;

        private readonly WebApiMapper _mapper;
        public BrokerAccountSummaryController(WebApiMapper mapper,
            IBrokerAccountSummaryService brokerAccountSummaryService)
        {
            _mapper = mapper;
            _brokerAccountSummaryService = brokerAccountSummaryService;
        }

        [HttpGet(nameof(GetSummaryByBrokerAccount))]
        public async Task<BrokerAccountSummaryModel> GetSummaryByBrokerAccount(Guid brokerAccountId, DateTime from, DateTime to)
        {
            var brokerAccount = await _brokerAccountSummaryService.GetSummaryByBrokerAccountAsync(brokerAccountId);
            return _mapper.Map(brokerAccount);
        }

        [HttpGet(nameof(GetSummary))]
        public async Task<BrokerAccountSummaryModel> GetSummary(DateTime from, DateTime to)
        {
            var brokerAccount = await _brokerAccountSummaryService.GetSummaryAsync();
            return _mapper.Map(brokerAccount);
        }

        [HttpGet(nameof(GetMonthTransfersHistory))]
        public async Task<BrokerAccountMonthTransfersHistoryModel> GetMonthTransfersHistory(int month, int year)
        {
            var brokerAccount = await _brokerAccountSummaryService.GetMonthTransfersHistoryAsync(month, year);
            return _mapper.Map(brokerAccount);
        }

        [HttpGet(nameof(GetMonthTransfersHistoryByBrokerAccount))]
        public async Task<BrokerAccountMonthTransfersHistoryModel> GetMonthTransfersHistoryByBrokerAccount(Guid brokerAccountId, int month, int year)
        {
            var brokerAccount = await _brokerAccountSummaryService.GetMonthTransfersHistoryByBrokerAccountAsync(brokerAccountId, month, year);
            return _mapper.Map(brokerAccount);
        }

        [HttpGet(nameof(GetYearTransfersHistory))]
        public async Task<BrokerAccountYearTransfersHistoryModel> GetYearTransfersHistory(int year)
        {
            var brokerAccount = await _brokerAccountSummaryService.GetYearTransfersHistoryAsync(year);
            return _mapper.Map(brokerAccount);
        }

        [HttpGet(nameof(GetYearTransfersHistoryByBrokerAccount))]
        public async Task<BrokerAccountYearTransfersHistoryModel> GetYearTransfersHistoryByBrokerAccount(Guid brokerAccountId, int year)
        {
            var brokerAccount = await _brokerAccountSummaryService.GetYearTransfersHistoryByBrokerAccountAsync(brokerAccountId, year);
            return _mapper.Map(brokerAccount);
        }

        [HttpGet(nameof(GetDailyStatsByBrokerAccount))]
        public async Task<BrokerAccountDailyStatsModel> GetDailyStatsByBrokerAccount([FromQuery] Guid brokerAccountId)
        {
            var brokerAccount = await _brokerAccountSummaryService.GetDailyStatsByBrokerAccountAsync(brokerAccountId);
            return _mapper.Map(brokerAccount);
        }

        [HttpGet(nameof(GetDailyStats))]
        public async Task<BrokerAccountDailyStatsModel> GetDailyStats()
        {
            var brokerAccount = await _brokerAccountSummaryService.GetDailyStatsAsync();
            return _mapper.Map(brokerAccount);
        }

        [HttpGet(nameof(GetPortfolioValuesByBrokerAccount))]
        public async Task<BrokerAccountPortfolioModel> GetPortfolioValuesByBrokerAccount([FromQuery] Guid brokerAccountId)
        {
            var brokerAccount = await _brokerAccountSummaryService.GetPortfolioValuesByBrokerAccountAsync(brokerAccountId);
            return _mapper.Map(brokerAccount);
        }

        [HttpGet(nameof(GetPortfolioValues))]
        public async Task<BrokerAccountPortfolioModel> GetPortfolioValues()
        {
            var brokerAccount = await _brokerAccountSummaryService.GetPortfolioValuesAsync();
            return _mapper.Map(brokerAccount);
        }

        [HttpGet(nameof(GetTransfersAvailableDates))]
        public async Task<BrokerAccountTransfersAvailableDatesModel> GetTransfersAvailableDates([FromQuery] Guid? brokerAccountId)
        {
            var dates = await _brokerAccountSummaryService.GetTransfersAvailableDatesAsync(brokerAccountId);
            return _mapper.Map(dates);
        }

    }
}