import { z } from 'zod';
import { TFunction } from 'i18next';
import { getCurrencyValidationSchema } from '@/validation/CurrencyValidationSchema';

export const getBrokerAccountValidationSchema = (t: TFunction) => z.object({
    id: z.string().optional(),
    name: z.string().min(1, t("validation_field_required")),
    bank: z.object({
        id: z.string(),
        name: z.string()
    }).optional(),
    type: z.object({
        id: z.string().min(1, t("validation_broker_account_type_required")),
        name: z.string()
    }, { message: t("validation_broker_account_type_required") }),
    currency: getCurrencyValidationSchema(t),
    broker: z.object({
        id: z.string().min(1, t("validation_broker_required")),
        name: z.string()
    }, { message: t("validation_broker_required") }),
    mainCurrencyAmount: z.number().gte(0, t("validation_non_negative_number"))
});

export type BrokerAccountFormInput = z.infer<ReturnType<typeof getBrokerAccountValidationSchema>>;