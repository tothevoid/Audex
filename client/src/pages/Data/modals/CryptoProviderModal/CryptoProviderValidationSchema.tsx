import { z } from 'zod';
import { TFunction } from 'i18next';

export const getCryptoProviderValidationSchema = (t: TFunction) => z.object({
    id: z.string().optional(),
    name: z.string().min(1, t("validation_field_required")),
    active: z.boolean()
});

export type CryptoProviderFormInput = z.infer<ReturnType<typeof getCryptoProviderValidationSchema>>;