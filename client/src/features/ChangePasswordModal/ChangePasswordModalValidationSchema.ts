import { z } from 'zod';
import { TFunction } from 'i18next';

export const getChangePasswordModalValidationSchema = (t: TFunction) => z.object({
    currentPassword: z.string().min(1, t('validation_password_required')),
    newPassword: z.string().min(6, t('validation_password_min_length')).max(100),
    confirmPassword: z.string().min(6, t('validation_password_min_length')).max(100),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: t('validation_passwords_must_match'),
    path: ['confirmPassword'],
});

export type ChangePasswordModalInput = z.infer<ReturnType<typeof getChangePasswordModalValidationSchema>>;
