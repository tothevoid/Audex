using Audex.Application.DTO.Transactions;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.Transactions
{
    public interface ITransactionsService
    {
        Task<TransactionDto> GetByIdAsync(Guid id);
        Task<IEnumerable<TransactionDto>> GetAllAsync(TransactionFilterDto filter);
        Task<TransactionDto> AddAsync(TransactionDto transaction);
        Task DeleteAsync(Guid id);
        Task UpdateAsync(TransactionDto transactionToUpdate);
    }
}