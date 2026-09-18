import { z } from 'zod';
import { TFunction } from 'i18next';

export const getSetupValidationSchema = (t: TFunction) => z.object({
    password: z.string().min(6, t("validation_password_min_length")).max(100),
    confirmPassword: z.string().min(1, t("validation_password_required"))
}).refine(data => data.password === data.confirmPassword, {
    message: t("validation_passwords_must_match"),
    path: ["confirmPassword"]
});

export type SetupFormInput = z.infer<ReturnType<typeof getSetupValidationSchema>>;
