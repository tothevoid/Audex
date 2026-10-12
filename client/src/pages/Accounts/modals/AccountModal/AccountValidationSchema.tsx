import { z } from 'zod';
import { TFunction } from 'i18next';

export const getAccountValidationSchema = (t: TFunction) => z.object({
	id: z.string().optional(),
	name: z.string().min(1, t("validation_field_required")),
	bank: z.object({
		id: z.string().optional(),
		name: z.string().optional()
	}).nullable().optional(),
	balance: z.number(),
	active: z.boolean(),
	createdOn: z.date({ message: t("validation_date_required") }),
	accountType: z.object({
		id: z.string().min(1, t("validation_account_type_required")),
		name: z.string().optional()
	}, { message: t("validation_account_type_required") }),
	currency: z.object({
		id: z.string().min(1, t("validation_currency_required")),
		name: z.string().optional()
	}, { message: t("validation_currency_required") }),
});

export type AccountFormInput = z.infer<ReturnType<typeof getAccountValidationSchema>>;