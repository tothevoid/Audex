using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.DTO.Debts;
using Audex.Application.Interfaces.Debts;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Debts;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.WebApi.Controllers.Debts
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class DebtTagController : ControllerBase
    {
        private readonly IDebtTagService _debtTagService;
        private readonly WebApiMapper _mapper;

        public DebtTagController(IDebtTagService debtTagService, WebApiMapper mapper)
        {
            _debtTagService = debtTagService;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IEnumerable<DebtTagModel>> GetAll()
        {
            var tags = await _debtTagService.GetAllAsync();
            return _mapper.Map(tags);
        }

        [HttpGet("Stats")]
        public async Task<IEnumerable<DebtTagStatsModel>> GetStats()
        {
            var stats = await _debtTagService.GetStatsAsync();
            return _mapper.Map(stats);
        }

        [HttpPut]
        public async Task<Guid> Add([FromBody] DebtTagModel model)
        {
            var dto = _mapper.Map(model);
            return await _debtTagService.AddAsync(dto);
        }

        [HttpPatch]
        public async Task Update([FromBody] DebtTagModel model)
        {
            var dto = _mapper.Map(model);
            await _debtTagService.UpdateAsync(dto);
        }

        [HttpDelete]
        public async Task Delete([FromQuery] Guid id)
        {
            await _debtTagService.DeleteAsync(id);
        }

        [HttpPut("Debt/{debtId}")]
        public async Task AssignTagsToDebt([FromRoute] Guid debtId, [FromBody] IEnumerable<Guid> tagIds)
        {
            await _debtTagService.AssignTagsToDebtAsync(debtId, tagIds);
        }
    }
}
