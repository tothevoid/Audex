using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Securities;
using Audex.Shared.Common;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Securities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.WebApi.Controllers.Securities
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class DividendController : ControllerBase
    {
        private readonly IDividendService _dividendService;
        private readonly WebApiMapper _mapper;
        public DividendController(IDividendService dividendService, WebApiMapper mapper)
        {
            _mapper = mapper;
            _dividendService = dividendService;
        }

        [HttpPost(nameof(GetAll))]
        public async Task<PagedResult<DividendModel>> GetAll(GetAllDividendsQuery query)
        {
            var filter = _mapper.Map(query);
            var dividends = await _dividendService.GetAllAsync(filter);
            return _mapper.Map(dividends);
        }

        [HttpGet(nameof(GetAvailable))]
        public async Task<IEnumerable<DividendModel>> GetAvailable(Guid brokerAccountId)
        {
            var securities = await _dividendService.GetAvailableAsync(brokerAccountId);
            return _mapper.Map(securities);
        }

        [HttpPut]
        public async Task<Guid> Add(DividendModel dividend)
        {
            var dividendDto = _mapper.Map(dividend);
            return await _dividendService.AddAsync(dividendDto);
        }

        [HttpPatch]
        public async Task Update(DividendModel dividend)
        {
            var dividendDto = _mapper.Map(dividend);
            await _dividendService.UpdateAsync(dividendDto);
        }

        [HttpDelete]
        public async Task Delete(Guid id) =>
            await _dividendService.DeleteAsync(id);
    }
}