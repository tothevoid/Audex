import { z } from 'zod';
import { TFunction } from 'i18next';

export const getCryptocurrencyValidationSchema = (t: TFunction) => z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    symbol: z.string().min(1, t("validation_field_required")),
    price: z.number().optional()
});

export type CryptocurrencyFormInput = z.infer<ReturnType<typeof getCryptocurrencyValidationSchema>>;