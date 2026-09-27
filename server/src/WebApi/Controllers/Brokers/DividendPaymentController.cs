using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.DTO.Brokers;
using Audex.Application.Interfaces.Brokers;
using Audex.Application.Services.Brokers;
using Audex.Shared.Common;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Brokers;
using Audex.WebApi.Models.Common;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.WebApi.Controllers.Brokers
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class DividendPaymentController : ControllerBase
    {
        private readonly IDividendPaymentService _dividendPaymentService;
        private readonly WebApiMapper _mapper;

        public DividendPaymentController(IDividendPaymentService dividendPaymentService, WebApiMapper mapper)
        {
            _mapper = mapper;
            _dividendPaymentService = dividendPaymentService;
        }

        [HttpPost(nameof(GetAll))]
        public async Task<PagedResult<DividendPaymentModel>> GetAll(GetAllDividendsPaymentsQuery query)
        {
            var filter = _mapper.Map(query);
            var dividendPayments = await _dividendPaymentService.GetAllAsync(filter);
            return _mapper.Map(dividendPayments);
        }

        [HttpGet(nameof(GetEarningsByBrokerAccount))]
        public async Task<decimal> GetEarningsByBrokerAccount([FromQuery] Guid brokerAccountId)
        {
            return await _dividendPaymentService.GetEarningsByBrokerAccountAsync(brokerAccountId);
        }

        [HttpPut]
        public async Task<Guid> Add(DividendPaymentModel dividendPayment)
        {
            var dividendDto = _mapper.Map(dividendPayment);
            return await _dividendPaymentService.AddAsync(dividendDto);
        }

        [HttpPatch]
        public async Task Update(DividendPaymentModel dividendPayment)
        {
            var dividendDto = _mapper.Map(dividendPayment);
            await _dividendPaymentService.UpdateAsync(dividendDto);
        }

        [HttpDelete]
        public async Task Delete(Guid id) =>
            await _dividendPaymentService.DeleteAsync(id);
    }
}