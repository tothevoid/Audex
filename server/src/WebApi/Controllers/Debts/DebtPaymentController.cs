using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.DTO.Debts;
using Audex.Application.Interfaces.Debts;
using Audex.Shared.Common;
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
    public class DebtPaymentController : ControllerBase
    {
        private readonly IDebtPaymentService _debtPaymentService;
        private readonly WebApiMapper _mapper;
        public DebtPaymentController(IDebtPaymentService debtPaymentService, WebApiMapper mapper)
        {
            _mapper = mapper;
            _debtPaymentService = debtPaymentService;
        }

        [HttpPost(nameof(GetAll))]
        public async Task<PagedResult<DebtPaymentModel>> GetAll(GetAllDebtPaymentsQuery query)
        {
            var filter = _mapper.Map(query);
            var debtPayments = await _debtPaymentService.GetAllAsync(filter);
            return _mapper.Map(debtPayments);
        }

        [HttpPut]
        public async Task<Guid> Add(DebtPaymentModel debtPayment)
        {
            var debtPaymentDto = _mapper.Map(debtPayment);
            return await _debtPaymentService.AddAsync(debtPaymentDto);
        }

        [HttpPatch]
        public async Task Update(DebtPaymentModel debtPayment)
        {
            var debtPaymentDto = _mapper.Map(debtPayment);
            await _debtPaymentService.UpdateAsync(debtPaymentDto);
        }

        [HttpDelete]
        public async Task Delete(Guid id) =>
            await _debtPaymentService.DeleteAsync(id);
    }
}
