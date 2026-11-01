using System;

namespace Audex.Application.Attributes.Scheduler
{
    [AttributeUsage(AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
    public sealed class ScheduledJobAttribute : Attribute
    {
        public string TaskName { get; }

        public string DisplayNameKey { get; }

        public string DescriptionKey { get; }

        public string CategoryKey { get; }

        public string DefaultCronExpression { get; }

        public bool AllowStartupCatchUp { get; }

        public ScheduledJobAttribute(
            string taskName,
            string displayNameKey,
            string descriptionKey,
            string categoryKey,
            string defaultCronExpression = "0 0 * * *",
            bool allowStartupCatchUp = false)
        {
            TaskName = taskName;
            DisplayNameKey = displayNameKey;
            DescriptionKey = descriptionKey;
            CategoryKey = categoryKey;
            DefaultCronExpression = defaultCronExpression;
            AllowStartupCatchUp = allowStartupCatchUp;
        }
    }
}
