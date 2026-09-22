#nullable enable

namespace Audex.Application.Services.Brokers.Statements.Vtb.Models
{
    public sealed class VtbBoundColumn
    {
        public int ColumnNumber { get; }
        public VtbColumnDefinition Definition { get; }

        public VtbBoundColumn(int columnNumber, VtbColumnDefinition definition)
        {
            ColumnNumber = columnNumber;
            Definition = definition;
        }
    }
}
