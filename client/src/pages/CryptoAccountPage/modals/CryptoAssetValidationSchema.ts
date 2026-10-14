import { z } from 'zod';
import { TFunction } from 'i18next';

export const getCryptoAssetValidationSchema = (t: TFunction) => z.object({
  id: z.string().optional(),
  cryptocurrency: z.object({
    id: z.string().min(1, t("validation_cryptocurrency_required")),
    name: z.string()
  }, { message: t("validation_cryptocurrency_required") }),
  cryptoAccount: z.object({
    id: z.string().min(1, t("validation_crypto_account_required")),
    name: z.string()
  }, { message: t("validation_crypto_account_required") }),
  quantity: z.number().gte(0, t("validation_non_negative_number"))
});

export type CryptoAssetFormInput = z.infer<ReturnType<typeof getCryptoAssetValidationSchema>>;
