using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.DTO.Brokers;
using Audex.Application.Interfaces.Brokers;
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
    public class BrokerAccountFundsTransferController : ControllerBase
    {
        private readonly IBrokerAccountFundsTransferService _brokerAccountFundsTransferService;
        private readonly WebApiMapper _mapper;

        public BrokerAccountFundsTransferController(IBrokerAccountFundsTransferService brokerAccountFundsTransferService, WebApiMapper mapper)
        {
            _brokerAccountFundsTransferService = brokerAccountFundsTransferService;
            _mapper = mapper;
        }

        [HttpPost(nameof(GetAll))]
        public async Task<PagedResult<BrokerAccountFundsTransferModel>> GetAll(GetAllBrokerAccountFundTransferQuery query)
        {
            var filter = _mapper.Map(query);
            var transfers = await _brokerAccountFundsTransferService.GetAllAsync(filter);
            return _mapper.Map(transfers);
        }

        [HttpPut]
        public async Task<BrokerAccountFundsTransferModel> Add(BrokerAccountFundsTransferModel transferModel)
        {
            var transferDto = _mapper.Map(transferModel);
            var result = await _brokerAccountFundsTransferService.AddAsync(transferDto);
            return _mapper.Map(result);
        }

        [HttpPatch]
        public async Task Update(BrokerAccountFundsTransferModel transferModel)
        {
            var transferDto = _mapper.Map(transferModel);
            await _brokerAccountFundsTransferService.UpdateAsync(transferDto);
        }

        [HttpDelete]
        public async Task Delete(Guid id) =>
            await _brokerAccountFundsTransferService.DeleteAsync(id);
    }
}
