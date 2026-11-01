using System;

namespace Audex.Application.DTO.Scheduler
{
    public record ScheduledJobDescriptor(
        Type JobType,
        string TaskName,
        string DisplayNameKey,
        string DescriptionKey,
        string CategoryKey,
        string DefaultCronExpression,
        bool AllowStartupCatchUp = false);
}
