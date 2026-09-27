using Audex.Application.DTO.Debts;
using Audex.Shared.Common;
using System;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Debts
{
    public interface IDebtPaymentService
    {
        Task<DebtPaymentDto> GetByIdAsync(Guid id);
        Task<PagedResult<DebtPaymentDto>> GetAllAsync(DebtPaymentFilterDto filter);
        Task<Guid> AddAsync(DebtPaymentDto debtPayment);
        Task UpdateAsync(DebtPaymentDto updatedPaymentDto);
        Task DeleteAsync(Guid id);
    }
}