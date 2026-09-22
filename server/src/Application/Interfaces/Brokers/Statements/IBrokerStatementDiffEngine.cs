using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Application.DTO.Brokers.Statements;

namespace Audex.Application.Interfaces.Brokers.Statements
{
    public interface IBrokerStatementDiffEngine
    {
        Task<BrokerStatementAnalysisResultDto> ComputeDiffAsync(
            Guid brokerAccountId,
            string importerId,
            string timeZoneId,
            IReadOnlyList<ParsedStatementTransactionDto> parsedTransactions);
    }
}
