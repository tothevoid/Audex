import { z } from 'zod';
import { TFunction } from 'i18next';

export const getDepositValidationSchema = (t: TFunction) => z.object({
  id: z.string().optional(),
  name: z.string().min(1, t("validation_field_required")),
  bank: z.object({
    id: z.string().min(1, t("validation_bank_required")),
    name: z.string().optional()
  }, { message: t("validation_bank_required") }),
  percentage: z.number()
    .gt(0, t("validation_positive_number"))
    .max(100, t("validation_percentage_range")),
  initialAmount: z.number()
    .gt(0, t("validation_positive_number")),
  estimatedEarn: z.number()
    .gt(0, t("validation_positive_number")),
  currency: z.object({
    id: z.string().min(1, t("validation_currency_required")),
    name: z.string().optional()
  }, { message: t("validation_currency_required") }),
  from: z.date({ message: t("validation_date_required") }),
  to: z.date({ message: t("validation_date_required") }),
})
.refine(({ from, to }) => to > from, {
  message: t("validation_end_date_after_start"),
  path: ["to"],
})
.refine(({ from, to }) => from < to, {
  message: t("validation_start_date_before_end"),
  path: ["from"],
});

export type DepositFormInput = z.infer<ReturnType<typeof getDepositValidationSchema>>;