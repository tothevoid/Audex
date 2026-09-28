import { z } from 'zod';
import { TFunction } from 'i18next';
import { CronFrequency, isValidCronExpression } from '@/pages/Scheduler/schedulerUtils';

export const getScheduleValidationSchema = (t: TFunction) => z.object({
    cronExpression: z.string()
        .min(1, t('validation_cron_required'))
        .refine(isValidCronExpression, { message: t('validation_cron_invalid') }),
    frequency: z.nativeEnum(CronFrequency),
    time: z.string().optional(),
    daysOfWeek: z.array(z.string()).optional(),
    intervalValue: z.number().min(1, t('validation_positive_number')).max(59).optional()
});

export type ScheduleFormInput = z.infer<ReturnType<typeof getScheduleValidationSchema>>;
