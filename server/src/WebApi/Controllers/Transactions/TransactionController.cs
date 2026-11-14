using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System;
using Audex.Application.DTO.Transactions;
using Audex.Application.Interfaces.Transactions;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Transactions;
using Microsoft.AspNetCore.Authorization;

namespace Audex.WebApi.Controllers.Transactions
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class TransactionController : ControllerBase
    {
        private readonly ITransactionsService _transactionService;
        private readonly WebApiMapper _mapper;
        public TransactionController(ITransactionsService transactionService, WebApiMapper mapper)
        {
            _mapper = mapper;
            _transactionService = transactionService;
        }
       
        [HttpGet]
        public async Task<IEnumerable<TransactionModel>> GetAll([FromQuery] GetTransactionsQuery query)
        {
            var filter = _mapper.Map(query);
            var transactions = await _transactionService.GetAllAsync(filter);
            return _mapper.Map(transactions);
        }

        [HttpGet("GetSummary")]
        public async Task<TransactionSummaryModel> GetSummary([FromQuery] GetTransactionsQuery query)
        {
            var filter = _mapper.Map(query);
            var summary = await _transactionService.GetSummaryAsync(filter);
            return _mapper.Map(summary);
        }

        [HttpPut]
        public async Task<TransactionModel> Add(TransactionModel transaction)
        {
            var transactionDto = _mapper.Map(transaction);
            var addedTransaction = await _transactionService.AddAsync(transactionDto);
            return _mapper.Map(addedTransaction);
        }

        [HttpPatch]
        public async Task Update(TransactionModel updatedTransaction)
        {
            var transactionDto = _mapper.Map(updatedTransaction);
            await _transactionService.UpdateAsync(transactionDto);
        }

        [HttpDelete]
        public async Task Delete(Guid id)
        {
            await _transactionService.DeleteAsync(id);
        }
    }
}