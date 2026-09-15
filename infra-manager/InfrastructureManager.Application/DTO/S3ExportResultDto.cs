using System.Collections.Generic;

namespace InfrastructureManager.Application.DTO
{
    public class S3ExportResultDto
    {
        public int ObjectsCount { get; set; }

        public List<string> IncludedBuckets { get; set; } = new();
    }
}
