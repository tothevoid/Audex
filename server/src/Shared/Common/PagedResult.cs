using System.Collections.Generic;

namespace Audex.Shared.Common
{
    public class PagedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = [];

        public int TotalCount { get; set; }

        public int PageIndex { get; set; }

        public int PageSize { get; set; }
    }
}
