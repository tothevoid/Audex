using System;
using System.Collections.Generic;

namespace Audex.Application.DTO.Brokers.Statements
{
    public class ApplyStatementDiffsRequestDto
    {
        public Guid SessionId { get; set; }

        public IReadOnlyList<Guid> SelectedDiffIds { get; set; } = new List<Guid>();
    }
}
