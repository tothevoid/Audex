using System.Collections.Generic;

namespace Audex.Application.DTO.Brokers.Statements
{
    public class BrokerStatementImporterDto
    {
        public string Id { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public IReadOnlyList<string> SupportedExtensions { get; set; } = new List<string>();
    }
}
