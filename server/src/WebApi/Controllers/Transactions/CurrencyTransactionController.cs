using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using Audex.Application.DTO.Transactions;
using Audex.Application.Interfaces.Transactions;
using Audex.Shared.Common;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Transactions;
using Microsoft.AspNetCore.Authorization;

namespace Audex.WebApi.Controllers.Transactions
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class CurrencyTransactionController : ControllerBase
    {
        private readonly ICurrencyTransactionService _currencyTransactionService;
        private readonly WebApiMapper _mapper;
        public CurrencyTransactionController(ICurrencyTransactionService currencyTransactionService, WebApiMapper mapper)
        {
            _mapper = mapper;
            _currencyTransactionService = currencyTransactionService;
        }

        [HttpPost(nameof(GetAll))]
        public async Task<PagedResult<CurrencyTransactionModel>> GetAll(GetAllCurrencyTransactionsQuery query)
        {
            var filter = _mapper.Map(query);
            var currencyTransactions = await _currencyTransactionService.GetAllAsync(filter);
            return _mapper.Map(currencyTransactions);
        }

        [HttpGet(nameof(GetById))]
        public async Task<ActionResult<CurrencyTransactionModel>> GetById(Guid id)
        {
            var dto = await _currencyTransactionService.GetByIdAsync(id);
            if (dto == null) return NotFound();
            return _mapper.Map(dto);
        }

        [HttpGet(nameof(GetSummaryByAccountId))]
        public async Task<CurrencyAccountSummaryModel> GetSummaryByAccountId([FromQuery] Guid accountId)
        {
            var dto = await _currencyTransactionService.GetSummaryByAccountIdAsync(accountId);
            return _mapper.Map(dto);
        }

        [HttpPut]
        public async Task<Guid> Add(CurrencyTransactionModel currencyTransaction)
        {
            var currencyTransactionDto = _mapper.Map(currencyTransaction);
            return await _currencyTransactionService.AddAsync(currencyTransactionDto);
        }

        [HttpPatch]
        public async Task Update(CurrencyTransactionModel currencyTransaction)
        {
            var currencyTransactionDto = _mapper.Map(currencyTransaction);
            await _currencyTransactionService.UpdateAsync(currencyTransactionDto);
        }

        [HttpDelete]
        public async Task Delete(Guid id) =>
            await _currencyTransactionService.DeleteAsync(id);
    }
}
