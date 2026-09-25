using Audex.Shared.Common;
using System;

namespace Audex.WebApi.Models.Securities
{
    public class GetAllDividendsQuery : BasePageable
    {
        public Guid SecurityId { get; set; }
    }
}
