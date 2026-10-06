using System.Collections.Generic;

namespace Audex.Application.Models.Widgets.Oil
{
    public record BenchmarkConfiguration(
        string Symbol,
        IReadOnlyList<BenchmarkSource> Sources);
}
