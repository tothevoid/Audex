using System;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.Interfaces.Transactions;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Audex.Application.DTO.Transactions;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Transactions;
using Microsoft.AspNetCore.Authorization;

namespace Audex.WebApi.Controllers.Transactions
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class TransactionTypeController : ControllerBase
    {
        private readonly ITransactionTypeService _transactionTypeService;
        private readonly WebApiMapper _mapper;
        public TransactionTypeController(ITransactionTypeService transactionTypeService, WebApiMapper mapper)
        {
            _mapper = mapper;
            _transactionTypeService = transactionTypeService;
        }

        [HttpGet]
        public async Task<IEnumerable<TransactionTypeModel>> GetAll(bool onlyActive = false)
        {
            var transactions = await _transactionTypeService.GetAllAsync(onlyActive);
            return _mapper.Map(transactions);
        }

        [HttpPut]
        public async Task<TransactionTypeModel> Add([FromForm] string transactionTypeJson, [FromForm] IFormFile transactionTypeIcon)
        {
            var transactionType = JsonSerializer.Deserialize<TransactionTypeModel>(transactionTypeJson);
            var transactionTypeDto = _mapper.Map(transactionType);
            var transactionTypeResult = await _transactionTypeService.AddAsync(transactionTypeDto, transactionTypeIcon);

            return _mapper.Map(transactionTypeResult);
        }

        [HttpPatch]
        public async Task<TransactionTypeModel> Update([FromForm] string transactionTypeJson, [FromForm] IFormFile transactionTypeIcon = null)
        {
            var transactionType = JsonSerializer.Deserialize<TransactionTypeModel>(transactionTypeJson);
            var transactionTypeDto = _mapper.Map(transactionType);
            var transactionTypeResult = await _transactionTypeService.UpdateAsync(transactionTypeDto, transactionTypeIcon);

            return _mapper.Map(transactionTypeResult);
        }

        [HttpDelete]
        public async Task Delete(Guid id) =>
            await _transactionTypeService.DeleteAsync(id);

        [HttpGet("Icon")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTransactionTypeIcon(string iconKey)
        {
            var file = await _transactionTypeService.GetIconStreamAsync(iconKey);
            if (file == null)
            {
                return NotFound();
            }

            Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            return File(file.Stream, file.ContentType);
        }
    }
}