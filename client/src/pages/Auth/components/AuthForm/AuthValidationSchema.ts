import { z } from 'zod';
import { TFunction } from 'i18next';

export const getAuthValidationSchema = (t: TFunction) => z.object({
    userName: z.string().min(1, t("validation_login_required")).max(100),
    password: z.string().min(1, t("validation_password_required"))
});

export type AuthFormInput = z.infer<ReturnType<typeof getAuthValidationSchema>>;