import { Box, Button, Field, HStack, Input, Stack, Text } from "@chakra-ui/react";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { getSecurityValidationSchema, SecurityFormInput } from "../SecurityValidationSchema";
import { SecurityEntity } from "../../../../../models/securities/SecurityEntity";
import { SecurityTypeEntity } from "../../../../../models/securities/SecurityTypeEntity";
import { CurrencyEntity } from "../../../../../models/currencies/CurrencyEntity";
import CollectionSelect from "../../../../../shared/components/CollectionSelect/CollectionSelect";
import ImageInput from "../../../../../shared/components/Form/ImageInput/ImageInput";
import { generateGuid } from "../../../../../shared/utilities/idUtilities";
import { getIconUrl } from "../../../../../api/securities/securityApi";
import { OperationResult } from "../../../../../shared/models/OperationResult";

interface SecurityDetailsFormProps {
    initialValues?: Partial<SecurityFormInput>;
    security?: SecurityEntity | null;
    securityTypes: SecurityTypeEntity[];
    currencies: CurrencyEntity[];
    onSave: (security: SecurityEntity, icon: File | null) => Promise<OperationResult<SecurityEntity>>;
    onCancel: () => void;
    onBackToSearch?: () => void;
}

const SecurityDetailsForm: React.FC<SecurityDetailsFormProps> = ({
    initialValues,
    security,
    securityTypes,
    currencies,
    onSave,
    onCancel,
    onBackToSearch
}) => {
    const { t } = useTranslation();
    const [icon, setIcon] = useState<File | null>(null);
    const [iconUrl, setIconUrl] = useState<string | null>(
        security?.iconKey ? getIconUrl(security.iconKey) : null
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const validationSchema = useMemo(() => getSecurityValidationSchema(t), [t]);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors }
    } = useForm<SecurityFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: {
            id: security?.id ?? initialValues?.id ?? generateGuid(),
            name: security?.name ?? initialValues?.name ?? "",
            ticker: security?.ticker ?? initialValues?.ticker ?? "",
            isin: security?.isin ?? initialValues?.isin ?? "",
            type: security?.type ?? initialValues?.type,
            currency: security?.currency ?? initialValues?.currency
        }
    });

    const onSubmit = async (data: SecurityFormInput) => {
        setIsSaving(true);
        setSaveError(null);
        try {
            const trimmedTicker = data.ticker.trim();
            const result = await onSave({
                ...data,
                ticker: trimmedTicker,
                iconKey: security?.iconKey,
                priceFetchedAt: security?.priceFetchedAt,
                actualPrice: security?.actualPrice ?? 0
            } as SecurityEntity, icon);

            if (result && !result.isSuccess) {
                setSaveError(result.errorMessage || t("general_error"));
            }
        } finally {
            setIsSaving(false);
        }
    };

    const onImageSelected = (url: string, image: File) => {
        setIcon(image);
        setIconUrl(url);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap={4} py={2}>
                <HStack gap={4} align="flex-start">
                    <ImageInput imageUrl={iconUrl} onImageSelected={onImageSelected} />
                    <Field.Root invalid={!!errors.ticker} flex={1}>
                        <Field.Label>{t("entity_security_ticker")}</Field.Label>
                        <Input
                            {...register("ticker")}
                            autoComplete="off"
                            placeholder="SBER"
                        />
                        <Field.ErrorText>{errors.ticker?.message}</Field.ErrorText>
                    </Field.Root>
                </HStack>

                <Field.Root invalid={!!errors.isin}>
                    <Field.Label>{t("entity_security_isin")}</Field.Label>
                    <Input
                        {...register("isin")}
                        autoComplete="off"
                        placeholder="RU0009029540"
                    />
                    <Field.ErrorText>{errors.isin?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.name}>
                    <Field.Label>{t("entity_security_name")}</Field.Label>
                    <Input
                        {...register("name")}
                        autoComplete="off"
                        placeholder="Сбербанк"
                    />
                    <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.type}>
                    <Field.Label>{t("entity_security_type")}</Field.Label>
                    <CollectionSelect
                        name="type"
                        control={control}
                        placeholder="Select type"
                        collection={securityTypes}
                        labelSelector={(type => type.name)}
                        valueSelector={(type => type.id)}
                    />
                    <Field.ErrorText>{errors.type?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.currency}>
                    <Field.Label>{t("entity_security_currency")}</Field.Label>
                    <CollectionSelect
                        name="currency"
                        control={control}
                        placeholder="Select currency"
                        collection={currencies}
                        labelSelector={(curr => curr.name)}
                        valueSelector={(curr => curr.id)}
                    />
                    <Field.ErrorText>{errors.currency?.message}</Field.ErrorText>
                </Field.Root>

                {saveError && (
                    <Box p={3} borderRadius="md" backgroundColor="pnl_negative_bg" borderColor="border_primary" borderWidth="1px">
                        <Text color="status_danger" fontSize="sm">
                            {saveError}
                        </Text>
                    </Box>
                )}

                <HStack justify="space-between" w="full" gap={3} pt={4}>
                    {onBackToSearch ? (
                        <Button variant="outline" size="sm" onClick={onBackToSearch}>
                            {t("entity_security_back_to_search_button")}
                        </Button>
                    ) : (
                        <span />
                    )}
                    <HStack gap={3}>
                        <Button onClick={onCancel} variant="outline" disabled={isSaving}>
                            {t("modals_cancel_button")}
                        </Button>
                        <Button type="submit" colorPalette="blue" loading={isSaving}>
                            {t("modals_save_button")}
                        </Button>
                    </HStack>
                </HStack>
            </Stack>
        </form>
    );
};

export default SecurityDetailsForm;
