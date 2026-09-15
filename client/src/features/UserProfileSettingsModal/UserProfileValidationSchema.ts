import { string, z } from 'zod';

export type UserProfileFormInput = z.infer<typeof UserProfileValidationSchema>;

export const UserProfileValidationSchema = z.object({
	id: string(),
	languageCode: z.object({
		key: string().nonempty({message: "Language is not selected"}),
		value: string().nonempty({message: "Language is not selected"})
	}, {message: "Language is not selected"}),
	currency: z.object({
		id: string().nonempty({message: "Currency is not selected"}),
		name: string()
	}, {message: "Currency is not selected"}),
})