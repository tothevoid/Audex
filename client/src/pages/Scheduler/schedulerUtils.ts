import { i18n, TFunction } from 'i18next';
import { CronExpressionParser } from 'cron-parser';
import cronstrue from 'cronstrue/i18n';
import { ScheduledTaskExecutionStatus } from '@/models/scheduler/ScheduledTaskEntity';
import { getNormalizedLanguage } from '@/shared/utilities/localeUtils';

export interface StatusBadgeInfo {
    colorPalette: string;
    label: string;
}

export enum CronFrequency {
    Daily = 'Daily',
    Weekly = 'Weekly',
    IntervalMinutes = 'IntervalMinutes',
    IntervalHours = 'IntervalHours',
    Cron = 'Cron'
}

export interface CronScheduleConfig {
    frequency: CronFrequency;
    time: string;
    selectedDays: string[];
    intervalValue: number;
    customCron: string;
}

export const FREQUENCY_OPTIONS = [
    { key: CronFrequency.Daily, labelKey: 'scheduler_frequency_daily' },
    { key: CronFrequency.Weekly, labelKey: 'scheduler_frequency_weekly' },
    { key: CronFrequency.IntervalMinutes, labelKey: 'scheduler_frequency_interval_minutes' },
    { key: CronFrequency.IntervalHours, labelKey: 'scheduler_frequency_interval_hours' },
    { key: CronFrequency.Cron, labelKey: 'scheduler_frequency_cron' }
] as const;

export const DEFAULT_CRON_SCHEDULE: CronScheduleConfig = {
    frequency: CronFrequency.Daily,
    time: '09:00',
    selectedDays: ['1'],
    intervalValue: 15,
    customCron: '0 9 * * *'
};

export const getCronWeekDays = (i18n: i18n) => {
    const formatter = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' });
    return [1, 2, 3, 4, 5, 6, 0].map((day) => {
        // Construct fixed date for Monday-Sunday relative alignment
        const date = new Date(2024, 0, day === 0 ? 7 : day);
        const name = formatter.format(date);
        return {
            key: day.toString(),
            label: name.charAt(0).toUpperCase() + name.slice(1)
        };
    });
};

export const getMaxIntervalValue = (frequency: CronFrequency): number => {
    return frequency === CronFrequency.IntervalMinutes ? 59 : 23;
};

export const clampIntervalValue = (value: string | number, frequency: CronFrequency): number => {
    const parsed = typeof value === 'number' ? value : parseInt(value, 10);
    if (isNaN(parsed) || parsed < 1) return 1;
    const max = getMaxIntervalValue(frequency);
    return Math.min(parsed, max);
};

export const isValidCronExpression = (cron: string): boolean => {
    if (!cron?.trim()) return false;
    try {
        CronExpressionParser.parse(cron.trim());
        return true;
    } catch {
        return false;
    }
};

type CronFields = ReturnType<typeof CronExpressionParser.parse>['fields'];

const formatCronTime = (hour: number, minute: number): string =>
    `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

const tryParseMinuteInterval = (fields: CronFields, trimmed: string): CronScheduleConfig | null => {
    const { minute, hour, dayOfMonth, month, dayOfWeek } = fields;
    const isStandardDate = dayOfMonth.isWildcard && month.isWildcard;

    if (!isStandardDate || !dayOfWeek.isWildcard || !hour.isWildcard) {
        return null;
    }

    const intervalValue = minute.isWildcard || minute.values.length === 60
        ? 1
        : minute.values.length > 1
            ? ((minute.values[1] as number) - (minute.values[0] as number)) || 15
            : 0;

    if (intervalValue <= 0) {
        return null;
    }

    return {
        frequency: CronFrequency.IntervalMinutes,
        time: '00:00',
        selectedDays: [],
        intervalValue,
        customCron: trimmed
    };
};

const tryParseHourInterval = (fields: CronFields, trimmed: string): CronScheduleConfig | null => {
    const { minute, hour, dayOfMonth, month, dayOfWeek } = fields;
    const isStandardDate = dayOfMonth.isWildcard && month.isWildcard;
    const isMinuteZero = minute.values.length === 1 && minute.values[0] === 0;

    if (!isStandardDate || !dayOfWeek.isWildcard || !isMinuteZero) {
        return null;
    }

    const intervalValue = hour.isWildcard || hour.values.length === 24
        ? 1
        : hour.values.length > 1
            ? ((hour.values[1] as number) - (hour.values[0] as number)) || 1
            : 0;

    if (intervalValue <= 0) {
        return null;
    }

    return {
        frequency: CronFrequency.IntervalHours,
        time: '00:00',
        selectedDays: [],
        intervalValue,
        customCron: trimmed
    };
};

const tryParseDailySchedule = (fields: CronFields, trimmed: string): CronScheduleConfig | null => {
    const { minute, hour, dayOfMonth, month, dayOfWeek } = fields;
    const isStandardDate = dayOfMonth.isWildcard && month.isWildcard;

    if (!isStandardDate || !dayOfWeek.isWildcard || minute.values.length !== 1 || hour.values.length !== 1) {
        return null;
    }

    return {
        frequency: CronFrequency.Daily,
        time: formatCronTime(hour.values[0] as number, minute.values[0] as number),
        selectedDays: [],
        intervalValue: 15,
        customCron: trimmed
    };
};

const tryParseWeeklySchedule = (fields: CronFields, trimmed: string): CronScheduleConfig | null => {
    const { minute, hour, dayOfMonth, month, dayOfWeek } = fields;
    const isStandardDate = dayOfMonth.isWildcard && month.isWildcard;

    if (!isStandardDate || dayOfWeek.isWildcard || minute.values.length !== 1 || hour.values.length !== 1) {
        return null;
    }

    return {
        frequency: CronFrequency.Weekly,
        time: formatCronTime(hour.values[0] as number, minute.values[0] as number),
        selectedDays: (dayOfWeek.values as number[]).map((d) => d.toString()),
        intervalValue: 15,
        customCron: trimmed
    };
};

export const parseCronSchedule = (cron?: string | null): CronScheduleConfig => {
    if (!cron?.trim()) {
        return { ...DEFAULT_CRON_SCHEDULE, customCron: '' };
    }

    const trimmed = cron.trim();

    try {
        const parsed = CronExpressionParser.parse(trimmed);
        const fields = parsed.fields;

        const config =
            tryParseMinuteInterval(fields, trimmed) ??
            tryParseHourInterval(fields, trimmed) ??
            tryParseDailySchedule(fields, trimmed) ??
            tryParseWeeklySchedule(fields, trimmed);

        if (config) {
            return config;
        }
    } catch {
        // Fall back to raw Cron string on parse error
    }

    return {
        frequency: CronFrequency.Cron,
        time: '09:00',
        selectedDays: ['1'],
        intervalValue: 15,
        customCron: trimmed
    };
};

export const buildCronSchedule = (config: CronScheduleConfig): string => {
    if (config.frequency === CronFrequency.Cron) {
        return config.customCron.trim();
    }

    const [hourStr, minStr] = (config.time || '09:00').split(':');
    const hour = parseInt(hourStr, 10) || 0;
    const min = parseInt(minStr, 10) || 0;

    switch (config.frequency) {
        case CronFrequency.Daily:
            return `${min} ${hour} * * *`;
        case CronFrequency.Weekly: {
            const daysStr = config.selectedDays.length > 0 ? config.selectedDays.join(',') : '*';
            return `${min} ${hour} * * ${daysStr}`;
        }
        case CronFrequency.IntervalMinutes:
            return `*/${config.intervalValue || 1} * * * *`;
        case CronFrequency.IntervalHours:
            return `0 */${config.intervalValue || 1} * * *`;
        default:
            return config.customCron.trim();
    }
};

export const toggleCronWeekDay = (selectedDays: string[], dayKey: string): string[] => {
    if (selectedDays.includes(dayKey)) {
        return selectedDays.length > 1 ? selectedDays.filter((d) => d !== dayKey) : selectedDays;
    }
    return [...selectedDays, dayKey];
};

export const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(1)} s`;
};

export const STATUS_META: Record<ScheduledTaskExecutionStatus, { colorPalette: string; labelKey: string }> = {
    [ScheduledTaskExecutionStatus.Done]: { colorPalette: 'green', labelKey: 'scheduler_journal_status_done' },
    [ScheduledTaskExecutionStatus.DueDone]: { colorPalette: 'teal', labelKey: 'scheduler_journal_status_due_done' },
    [ScheduledTaskExecutionStatus.Failed]: { colorPalette: 'red', labelKey: 'scheduler_journal_status_failed' },
    [ScheduledTaskExecutionStatus.InProgress]: { colorPalette: 'yellow', labelKey: 'scheduler_journal_status_in_progress' },
    [ScheduledTaskExecutionStatus.Queued]: { colorPalette: 'cyan', labelKey: 'scheduler_journal_status_queued' },
    [ScheduledTaskExecutionStatus.Idle]: { colorPalette: 'gray', labelKey: 'scheduler_journal_status_idle' },
    [ScheduledTaskExecutionStatus.Cancelled]: { colorPalette: 'purple', labelKey: 'scheduler_journal_status_cancelled' },
    [ScheduledTaskExecutionStatus.Skipped]: { colorPalette: 'orange', labelKey: 'scheduler_journal_status_skipped' },
    [ScheduledTaskExecutionStatus.Unknown]: { colorPalette: 'gray', labelKey: 'scheduler_journal_status_unknown' }
};

export const getStatusLabel = (status: ScheduledTaskExecutionStatus, t: TFunction): string => {
    const meta = STATUS_META[status] ?? STATUS_META[ScheduledTaskExecutionStatus.Unknown];
    return t(meta.labelKey);
};

export const getStatusBadgeProps = (
    status: ScheduledTaskExecutionStatus,
    t: TFunction
): StatusBadgeInfo => {
    const meta = STATUS_META[status] ?? STATUS_META[ScheduledTaskExecutionStatus.Unknown];
    return {
        colorPalette: meta.colorPalette,
        label: t(meta.labelKey)
    };
};

export const getStatusFilterOptions = (t: TFunction) => [
    { value: 'All', label: t('scheduler_all_statuses') },
    ...Object.entries(STATUS_META)
        .filter(([statusKey]) => Number(statusKey) !== ScheduledTaskExecutionStatus.Unknown)
        .map(([statusKey, meta]) => ({
            value: statusKey,
            label: t(meta.labelKey)
        }))
];

export const formatCronExpression = (
    cron: string | null | undefined,
    i18n: i18n,
    t?: TFunction
): string => {
    if (!cron?.trim()) {
        return t ? t('scheduler_cron_manual') : '';
    }
    try {
        const locale = getNormalizedLanguage(i18n);
        return cronstrue.toString(cron.trim(), {
            locale,
            use24HourTimeFormat: true
        });
    } catch {
        return cron;
    }
};

export const getTaskStatusDotColor = (
    isEnabled: boolean,
    lastExecutionStatus: ScheduledTaskExecutionStatus
): string => {
    if (!isEnabled) return 'gray.500';
    switch (lastExecutionStatus) {
        case ScheduledTaskExecutionStatus.Done:
        case ScheduledTaskExecutionStatus.DueDone:
            return 'green.400';
        case ScheduledTaskExecutionStatus.Failed:
            return 'red.400';
        case ScheduledTaskExecutionStatus.InProgress:
            return 'yellow.400';
        case ScheduledTaskExecutionStatus.Cancelled:
        case ScheduledTaskExecutionStatus.Skipped:
            return 'orange.400';
        case ScheduledTaskExecutionStatus.Queued:
        case ScheduledTaskExecutionStatus.Idle:
            return 'cyan.400';
        default:
            return 'blue.400';
    }
};
