using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System;
using Audex.Application.DTO.Accounts;
using Audex.Application.Interfaces.Accounts;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Accounts;
using Microsoft.AspNetCore.Authorization;

namespace Audex.WebApi.Controllers.Accounts
{
    [Authorize]
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly WebApiMapper _mapper;
        public AccountController(IAccountService accountService, WebApiMapper mapper)
        {
            _mapper = mapper;
            _accountService = accountService;
        }

        [HttpPost("GetAll")]
        public async Task<IEnumerable<AccountModel>> GetAll(AccountGetAllConfig getAllConfig)
        {
            var accounts = await _accountService.GetAllAsync(getAllConfig.OnlyActive, getAllConfig.CurrencyId, getAllConfig.AccountTypeId);
            return _mapper.Map(accounts);
        }

        [HttpPost("GetAllByTypes")]
        public async Task<IEnumerable<AccountModel>> GetAllByTypes(AccountGetAllByTypesConfig getAllConfig)
        {
            var accounts = await _accountService.GetAllByTypesAsync(getAllConfig.TypesIds, getAllConfig.OnlyActive);
            return _mapper.Map(accounts);
        }

        [HttpPut]
        public async Task<Guid> Add(AccountModel account)
        {
            var accountDto = _mapper.Map(account);
            return await _accountService.AddAsync(accountDto);
        }

        [HttpPatch]
        public async Task Update(AccountModel account)
        {
            var accountDto = _mapper.Map(account);
            await _accountService.UpdateAsync(accountDto);
        }

        [HttpDelete]
        public async Task Delete(Guid id) =>
            await _accountService.DeleteAsync(id);

        [HttpPost(nameof(Transfer))]
        public async Task Transfer(AccountTransferModel accountTransfer)
        {
            var transferDto = _mapper.Map(accountTransfer);
            await _accountService.TransferAsync(transferDto);
        }

        [HttpGet(nameof(GetSummary))]
        public async Task<IEnumerable<AccountCurrencySummaryModel>> GetSummary()
        {
            var result =  await _accountService.GetSummaryAsync();
            var summaryModel = _mapper.Map(result);
            return summaryModel;
        }

        [HttpGet(nameof(GetById))]
        public async Task<ActionResult<AccountModel>> GetById(Guid id)
        {
            var account = await _accountService.GetByIdAsync(id);
            if (account == null) return NotFound();
            return _mapper.Map(account);
        }
    }
}