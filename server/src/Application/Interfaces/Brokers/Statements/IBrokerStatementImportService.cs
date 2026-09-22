using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Audex.Application.DTO.Common;
using Audex.Application.DTO.Brokers.Statements;

namespace Audex.Application.Interfaces.Brokers.Statements
{
    public interface IBrokerStatementImportService
    {
        IReadOnlyList<BrokerStatementImporterDto> GetImporters();

        Task<BrokerStatementAnalysisResultDto> AnalyzeAsync(
            Stream fileStream,
            Guid brokerAccountId,
            string importerId,
            string timeZoneId);

        Task<OperationResultDto<ApplyStatementDiffsSummaryDto>> ApplyDiffsAsync(
            ApplyStatementDiffsRequestDto request);
    }
}
