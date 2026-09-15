#nullable enable
using System;
using System.Collections.Generic;

namespace InfrastructureManager.Application.DTO
{
    public class BackupManifestDto
    {
        public int Version { get; set; } = 1;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string AppName { get; set; } = null!;

        public List<string> IncludedBuckets { get; set; } = new();

        public int S3ObjectsCount { get; set; }

        public string DatabaseDumpFileName { get; set; } = null!;
    }
}
