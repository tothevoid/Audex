import { Field } from "@chakra-ui/react";
import React, { RefObject, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getCurrencyModalValidationSchema, CurrencyFormInput } from "./CurrencyValidationSchema";
import { useTranslation } from "react-i18next";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { WorldCurrencyDescriptor } from "@/models/currencies/WorldCurrencyDescriptor";
import CheckboxInput from "@/shared/components/CheckboxInput/CheckboxInput";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { generateGuid } from "@/shared/utilities/idUtilities";
import { useCurrencies } from "@/shared/hooks/queries/useCurrencies";
import { getAvailableWorldCurrencies } from "@/shared/utilities/currencyUtils";

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>;
    onSaved: (currency: CurrencyEntity) => void;
}

const CurrencyModal: React.FC<ModalProps> = ({
    modalRef,
    onSaved,
}: ModalProps) => {
    const { t, i18n } = useTranslation();
    const { data: existingCurrencies = [] } = useCurrencies();

    const availableCurrencies = useMemo(() => {
        const existingCurrencyCodes = new Set(
            existingCurrencies.map((existingCurrency) => existingCurrency.name.toUpperCase())
        );

        const allWorldCurrencies = getAvailableWorldCurrencies(i18n.language);

        return allWorldCurrencies.filter(
            (worldCurrency) => !existingCurrencyCodes.has(worldCurrency.code.toUpperCase())
        );
    }, [existingCurrencies, i18n.language]);

    const validationSchema = useMemo(() => getCurrencyModalValidationSchema(t), [t]);

    const createInitialFormValues = (): Partial<CurrencyFormInput> => ({
        id: generateGuid(),
        selectedCurrency: undefined,
        active: true,
    });

    const { handleSubmit, control, formState: { errors }, reset } = useForm<CurrencyFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: createInitialFormValues(),
    });

    const onVisibilityChanged = (isOpen: boolean) => {
        if (isOpen) {
            reset(createInitialFormValues());
        }
    };

    const onSubmit = (formData: CurrencyFormInput) => {
        onSaved({
            id: formData.id ?? generateGuid(),
            name: formData.selectedCurrency.code,
            active: formData.active,
            rate: 0,
        });
        modalRef?.current?.closeModal();
    };

    const handleFormSubmit: React.FormEventHandler = (event) => {
        handleSubmit(onSubmit)(event);
    };

    return (
        <BaseFormModal
            ref={modalRef}
            title={t("entity_currency_name_form_title")}
            submitHandler={handleFormSubmit}
            visibilityChanged={onVisibilityChanged}
            maxW="480px"
            bodyOverflowY="visible"
        >
            <Field.Root invalid={!!errors.selectedCurrency}>
                <Field.Label>{t("entity_currency_name")}</Field.Label>
                <CollectionSelect<WorldCurrencyDescriptor, CurrencyFormInput, false>
                    name="selectedCurrency"
                    control={control}
                    placeholder={t("currencies_select_placeholder")}
                    collection={availableCurrencies}
                    labelSelector={(currencyOption) => currencyOption.label}
                    valueSelector={(currencyOption) => currencyOption.code}
                    isClearable={false}
                />
                <Field.ErrorText>{errors.selectedCurrency?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root invalid={!!errors.active} mt={4}>
                <CheckboxInput name="active" control={control} title={t("entity_currency_active")} />
                <Field.ErrorText>{errors.active?.message}</Field.ErrorText>
            </Field.Root>
        </BaseFormModal>
    );
};

export default CurrencyModal;
