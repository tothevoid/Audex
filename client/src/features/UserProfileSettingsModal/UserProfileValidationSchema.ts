import { z } from 'zod';
import { TFunction } from 'i18next';

export const getUserProfileValidationSchema = (t: TFunction) => z.object({
	id: z.string(),
	languageCode: z.object({
		key: z.string().min(1, t("validation_field_required")),
		value: z.string().min(1, t("validation_field_required"))
	}, { message: t("validation_field_required") }),
	currency: z.object({
		id: z.string().min(1, t("validation_field_required")),
		name: z.string()
	}, { message: t("validation_field_required") }),
	timeZone: z.object({
		id: z.string().min(1, t("validation_field_required")),
		displayName: z.string()
	}, { message: t("validation_field_required") }).nullish()
});

export type UserProfileFormInput = z.infer<ReturnType<typeof getUserProfileValidationSchema>>;