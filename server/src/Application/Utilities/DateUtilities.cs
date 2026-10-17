#nullable enable
using System;

namespace Audex.Application.Utilities
{
    public static class DateUtilities
    {
        public static DateOnly Min(DateOnly firstDate, DateOnly secondDate) =>
            firstDate < secondDate ? firstDate : secondDate;

        public static DateOnly Max(DateOnly firstDate, DateOnly secondDate) =>
            firstDate > secondDate ? firstDate : secondDate;

        public static DateOnly Min(DateOnly firstDate, DateOnly? secondDate) =>
            secondDate.HasValue ? Min(firstDate, secondDate.Value) : firstDate;

        public static DateOnly Min(DateOnly? firstDate, DateOnly secondDate) =>
            firstDate.HasValue ? Min(firstDate.Value, secondDate) : secondDate;

        public static DateOnly Max(DateOnly firstDate, DateOnly? secondDate) =>
            secondDate.HasValue ? Max(firstDate, secondDate.Value) : firstDate;

        public static DateOnly Max(DateOnly? firstDate, DateOnly secondDate) =>
            firstDate.HasValue ? Max(firstDate.Value, secondDate) : secondDate;

        public static DateOnly? Min(DateOnly? firstDate, DateOnly? secondDate)
        {
            if (firstDate.HasValue && secondDate.HasValue)
            {
                return Min(firstDate.Value, secondDate.Value);
            }

            return firstDate ?? secondDate;
        }

        public static DateOnly? Max(DateOnly? firstDate, DateOnly? secondDate)
        {
            if (firstDate.HasValue && secondDate.HasValue)
            {
                return Max(firstDate.Value, secondDate.Value);
            }

            return firstDate ?? secondDate;
        }
    }
}
