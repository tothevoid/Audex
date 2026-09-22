#nullable enable
using System.Collections.Generic;
using Audex.Application.DTO.Brokers.Statements;

namespace Audex.Application.Interfaces.Brokers.Statements
{
    public interface IBrokerStatementImporterRegistry
    {
        IReadOnlyList<BrokerStatementImporterDto> GetAll();

        IBrokerStatementImporter GetById(string id);

        bool TryGetById(string id, out IBrokerStatementImporter? importer);
    }
}
