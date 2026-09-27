using Audex.Shared.Common;
using System;

namespace Audex.Application.DTO.Securities
{
    public class DividendFilterDto : BasePageable
    {
        public Guid SecurityId { get; set; }
    }
}
