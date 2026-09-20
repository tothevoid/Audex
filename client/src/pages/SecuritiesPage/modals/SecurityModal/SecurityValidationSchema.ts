import { z } from 'zod';
import { TFunction } from 'i18next';

export const getSecurityValidationSchema = (t: TFunction) => z.object({
    id: z.string().optional(),
    name: z.string().min(1, t("validation_field_required")),
    ticker: z.string().min(1, t("validation_field_required")),
    isin: z.string().optional(),
    type: z.object({
        id: z.string().min(1, t("validation_field_required")),
        name: z.string()
    }, { message: t("validation_field_required") }),
    currency: z.object({
        id: z.string().min(1, t("validation_currency_required")),
        name: z.string()
    }, { message: t("validation_currency_required") }),
});

export type SecurityFormInput = z.infer<ReturnType<typeof getSecurityValidationSchema>>;