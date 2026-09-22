#nullable enable
using System.Collections.Generic;
using System.Linq;

namespace Audex.Application.Services.Brokers.Statements.Vtb.Models
{
    public sealed class VtbTableSchema
    {
        public IReadOnlyList<VtbBoundColumn> BoundColumns { get; }

        public bool IsValid =>
            BoundColumns.Any(boundColumn => boundColumn.Definition.IsRequired && boundColumn.Definition.ColumnName.Contains("Инструмент")) &&
            BoundColumns.Any(boundColumn => boundColumn.Definition.IsRequired && boundColumn.Definition.ColumnName.Contains("Дата"));

        public VtbTableSchema(IReadOnlyList<VtbBoundColumn> boundColumns)
        {
            BoundColumns = boundColumns;
        }
    }
}
