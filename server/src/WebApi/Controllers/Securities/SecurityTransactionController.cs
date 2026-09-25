using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System;
using Audex.Application.DTO.Securities;
using Audex.Application.Interfaces.Securities;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Securities;
using Audex.Shared.Common;
using Microsoft.AspNetCore.Authorization;

namespace Audex.WebApi.Controllers.Securities
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class SecurityTransactionController : ControllerBase
    {
        private readonly ISecurityTransactionService _securityTransactionService;
        private readonly WebApiMapper _mapper;

        public SecurityTransactionController(ISecurityTransactionService securityTransactionService, WebApiMapper mapper)
        {
            _mapper = mapper;
            _securityTransactionService = securityTransactionService;
        }

        [HttpPost(nameof(GetAll))]
        public async Task<PagedResult<SecurityTransactionModel>> GetAll(GetAllSecuritiesTransactionsQuery request)
        {
            var filter = _mapper.Map(request);
            var pagedResult = await _securityTransactionService
                .GetAllAsync(filter);
            return _mapper.Map(pagedResult);
        }

        [HttpGet(nameof(GetTransactionsHistory))]
        public async Task<IEnumerable<SecurityTransactionsHistoryModel>> GetTransactionsHistory([FromQuery] Guid securityId)
        {
            var transactions = await _securityTransactionService
                .GetTransactionsHistoryAsync(securityId);
            return _mapper.Map(transactions);
        }

        [HttpPut]
        public async Task<Guid> Add(SecurityTransactionModel securityTransaction)
        {
            var securityTransactionDto = _mapper.Map(securityTransaction);
            return await _securityTransactionService.AddAsync(securityTransactionDto);
        }

        [HttpPatch]
        public async Task Update(SecurityTransactionModel securityTransaction)
        {
            var securityTransactionDto = _mapper.Map(securityTransaction);
            await _securityTransactionService.UpdateAsync(securityTransactionDto);
        }

        [HttpDelete]
        public async Task Delete(Guid id) =>
            await _securityTransactionService.DeleteAsync(id);
    }
}