import { Field, Input } from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";
import { useCurrencies } from "@/shared/hooks/queries/useCurrencies";
import { useBanks } from "@/shared/hooks/queries/useBanks";
import { useBrokerAccountTypes } from "@/shared/hooks/queries/useBrokerAccountTypes";
import { useBrokers } from "@/shared/hooks/queries/useBrokers";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import MoneyInput from "@/shared/components/MoneyInput/MoneyInput";
import { BrokerAccountFormInput, getBrokerAccountValidationSchema } from "./BrokerAccountValidationSchema";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { generateGuid } from "@/shared/utilities/idUtilities";

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>
    brokerAccount?: BrokerAccountEntity | null
    onSaved: (account: BrokerAccountEntity) => void
}

const BrokerAccountModal: React.FC<ModalProps> = ({
    modalRef,
    brokerAccount,
    onSaved
}: ModalProps) => {
    const { data: currencies = [] } = useCurrencies();
    const { data: banks = [] } = useBanks();
    const { data: brokerAccountTypes = [] } = useBrokerAccountTypes();
    const { data: brokers = [] } = useBrokers();

    const getFormDefaultValues = useCallback(() => {
        return {
            id: brokerAccount?.id ?? generateGuid(),
            name: brokerAccount?.name ?? "",
            type: brokerAccount?.type,
            currency: brokerAccount?.currency,
            broker: brokerAccount?.broker,
            mainCurrencyAmount: brokerAccount?.mainCurrencyAmount ?? 0,
            bank: brokerAccount?.bank
        };
    }, [brokerAccount]);

    const { t } = useTranslation();
    const validationSchema = useMemo(() => getBrokerAccountValidationSchema(t), [t]);

    const { register, handleSubmit, control, formState: { errors }, reset } = useForm<BrokerAccountFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: getFormDefaultValues()
    });

    useEffect(() => {
        reset(getFormDefaultValues());
    }, [reset, getFormDefaultValues, brokerAccount]);

    const selectedCurrency = useWatch({ control, name: "currency" });
    const currentCurrency = selectedCurrency?.name ?? '';

    const onSubmit = (submittedBrokerAccount: BrokerAccountFormInput) => {
        onSaved(submittedBrokerAccount as BrokerAccountEntity);
        modalRef.current?.closeModal();
    };

    const handleFormSubmit: React.FormEventHandler = (event) => {
        handleSubmit(onSubmit)(event);
    };

    return (
        <BaseFormModal ref={modalRef} title={t("entity_broker_account_form_title")} submitHandler={handleFormSubmit}>
            <Field.Root mt={4} invalid={!!errors.name}>
                <Field.Label>{t("entity_broker_account_name")}</Field.Label>
                <Input {...register("name")} placeholder="Broker" />
                <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root mt={4} invalid={!!errors.type}>
                <Field.Label>{t("entity_broker_account_type")}</Field.Label>
                <CollectionSelect name="type" control={control} placeholder="Select account type"
                    collection={brokerAccountTypes}
                    labelSelector={(accountType => accountType.name)}
                    valueSelector={(accountType => accountType.id)} />
                <Field.ErrorText>{errors.type?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root mt={4} invalid={!!errors.currency}>
                <Field.Label>{t("entity_broker_account_currency")}</Field.Label>
                <CollectionSelect name="currency" control={control} placeholder="Select currency"
                    collection={currencies}
                    labelSelector={(currency => currency.name)}
                    valueSelector={(currency => currency.id)} />
                <Field.ErrorText>{errors.currency?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root mt={4} invalid={!!errors.bank}>
                <Field.Label>{t("entity_broker_account_bank")}</Field.Label>
                <CollectionSelect name="bank" control={control} placeholder="Select bank"
                    collection={banks}
                    labelSelector={(bank => bank.name)}
                    valueSelector={(bank => bank.id)} />
                <Field.ErrorText>{errors.bank?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root mt={4} invalid={!!errors.mainCurrencyAmount}>
                <Field.Label>{t("entity_broker_account_main_currency_amount")}</Field.Label>
                <MoneyInput name="mainCurrencyAmount" control={control} currency={currentCurrency} placeholder='10' />
                <Field.ErrorText>{errors.mainCurrencyAmount?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root mt={4} invalid={!!errors.broker}>
                <Field.Label>{t("entity_broker_account_broker")}</Field.Label>
                <CollectionSelect name="broker" control={control} placeholder="Select broker"
                    collection={brokers}
                    labelSelector={(broker => broker.name)}
                    valueSelector={(broker => broker.id)} />
                <Field.ErrorText>{errors.broker?.message}</Field.ErrorText>
            </Field.Root>
        </BaseFormModal>
    );
};

export default BrokerAccountModal;