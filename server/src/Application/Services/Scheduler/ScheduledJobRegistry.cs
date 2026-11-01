using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.Attributes.Scheduler;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Scheduler;

namespace Audex.Application.Services.Scheduler
{
    public class ScheduledJobRegistry : IScheduledJobRegistry
    {
        private readonly Dictionary<string, ScheduledJobDescriptor> _descriptors;
        public ScheduledJobRegistry()
        {
            _descriptors = ScanScheduledJobs();
        }

        public IReadOnlyList<ScheduledJobDescriptor> GetAllDescriptors()
        {
            return _descriptors.Values.ToList();
        }

        public ScheduledJobDescriptor GetDescriptor(string taskName)
        {
            if (TryGetDescriptor(taskName, out var descriptor))
            {
                return descriptor;
            }

            throw new KeyNotFoundException($"Scheduled job with task name '{taskName}' was not found in registry.");
        }

        public bool TryGetDescriptor(string taskName, out ScheduledJobDescriptor descriptor)
        {
            if (string.IsNullOrWhiteSpace(taskName))
            {
                descriptor = null;
                return false;
            }

            return _descriptors.TryGetValue(taskName, out descriptor);
        }

        private static Dictionary<string, ScheduledJobDescriptor> ScanScheduledJobs()
        {
            var jobInterface = typeof(IScheduledJob);
            var assembly = jobInterface.Assembly;

            var jobTypes = assembly.GetTypes()
                .Where(t => t.IsClass && !t.IsAbstract && jobInterface.IsAssignableFrom(t));

            var result = new Dictionary<string, ScheduledJobDescriptor>(StringComparer.OrdinalIgnoreCase);

            foreach (var type in jobTypes)
            {
                var attr = type.GetCustomAttribute<ScheduledJobAttribute>();
                if (attr != null)
                {
                    var descriptor = new ScheduledJobDescriptor(
                        JobType: type,
                        TaskName: attr.TaskName,
                        DisplayNameKey: attr.DisplayNameKey,
                        DescriptionKey: attr.DescriptionKey,
                        CategoryKey: attr.CategoryKey,
                        DefaultCronExpression: Utilities.Scheduler.CronExpressionHelper.ToStandardCron(attr.DefaultCronExpression),
                        AllowStartupCatchUp: attr.AllowStartupCatchUp
                    );

                    result[attr.TaskName] = descriptor;
                }
            }

            return result;
        }
    }
}
