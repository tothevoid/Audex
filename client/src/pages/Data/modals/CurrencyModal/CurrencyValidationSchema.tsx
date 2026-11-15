import { z } from "zod";
import { TFunction } from "i18next";

export const getCurrencyModalValidationSchema = (t: TFunction) => z.object({
    id: z.string().optional(),
    selectedCurrency: z.object({
        code: z.string().min(1, t("validation_currency_required")),
        name: z.string(),
        symbol: z.string().optional(),
        label: z.string(),
    }, { message: t("validation_currency_required") }),
    active: z.boolean(),
});

export type CurrencyFormInput = z.infer<ReturnType<typeof getCurrencyModalValidationSchema>>;