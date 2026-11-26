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
    public class BrokerAccountTypeController : ControllerBase
    {
        private readonly IBrokerAccountTypeService _brokerAccountTypeService;
        private readonly WebApiMapper _mapper;
        public BrokerAccountTypeController(IBrokerAccountTypeService brokerAccountTypeService, WebApiMapper mapper)
        {
            _mapper = mapper;
            _brokerAccountTypeService = brokerAccountTypeService;
        }

        [HttpGet]
        public async Task<IEnumerable<BrokerAccountTypeModel>> GetAll(bool onlyActive = false)
        {
            var brokerAccountsTypes = await _brokerAccountTypeService.GetAllAsync(onlyActive);
            return _mapper.Map(brokerAccountsTypes);
        }

        [HttpPut]
        public async Task<Guid> Add(BrokerAccountTypeModel brokerAccountType)
        {
            var brokerAccountTypeDto = _mapper.Map(brokerAccountType);
            return await _brokerAccountTypeService.AddAsync(brokerAccountTypeDto);
        }

        [HttpPatch]
        public async Task Update(BrokerAccountTypeModel brokerAccountType)
        {
            var brokerAccountTypeDto = _mapper.Map(brokerAccountType);
            await _brokerAccountTypeService.UpdateAsync(brokerAccountTypeDto);
        }

        [HttpDelete]
        public async Task Delete(Guid id) =>
            await _brokerAccountTypeService.DeleteAsync(id);
    }
}