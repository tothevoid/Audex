#nullable enable
using System;
using System.Diagnostics.CodeAnalysis;
using Audex.Application.DTO.Brokers.Statements;

namespace Audex.Application.Interfaces.Brokers.Statements
{
    public interface IBrokerStatementSessionCache
    {
        void SetSession(BrokerStatementAnalysisResultDto session);

        bool TryGetSession(Guid sessionId, [NotNullWhen(true)] out BrokerStatementAnalysisResultDto? session);

        void RemoveSession(Guid sessionId);
    }
}
