using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Audex.Application.DTO.Brokers.Statements;

namespace Audex.Application.Interfaces.Brokers.Statements
{
    public interface IBrokerStatementImporter
    {
        string Id { get; }

        string Name { get; }

        IReadOnlyList<string> SupportedExtensions { get; }

        Task<IReadOnlyList<ParsedStatementTransactionDto>> ParseAsync(Stream fileStream, string timeZoneId);
    }
}
