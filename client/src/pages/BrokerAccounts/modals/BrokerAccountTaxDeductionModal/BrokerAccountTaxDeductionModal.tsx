import { Field, Input } from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { useTranslation } from "react-i18next";
import { generateGuid } from "@/shared/utilities/idUtilities";
import DateSelect from "@/shared/components/DateSelect/DateSelect";
import { BrokerAccountTaxDeductionFormInput, getBrokerAccountTaxDeductionValidationSchema } from "./BrokerAccountTaxDeductionValidationSchema";
import { BrokerAccountTaxDeductionEntity } from "@/models/brokers/BrokerAccountTaxDeductionEntity";
import { getBrokerAccounts } from "@/api/brokers/brokerAccountApi";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import MoneyInput from "@/shared/components/MoneyInput/MoneyInput";
import { findEntityById } from "@/shared/utilities/arrayUtilities";

import { Nullable } from "@/shared/utilities/nullable";

export interface CreateBrokerAccountTaxDeductionContext {
    brokerAccountId?: Nullable<string>;
}

export interface EditBrokerAccountTaxDeductionContext {
    taxDeduction: BrokerAccountTaxDeductionEntity
}

interface ModalProps {
    isGlobalBrokerAccount: boolean
    onSaved: (taxDeduction: BrokerAccountTaxDeductionEntity) => void
    context: CreateBrokerAccountTaxDeductionContext | EditBrokerAccountTaxDeductionContext
    modalRef: RefObject<BaseModalRef | null>
}

const BrokerAccountTaxDeductionModal: React.FC<ModalProps> = ({
    modalRef,
    isGlobalBrokerAccount,
    onSaved,
    context
}: ModalProps) => {
    const { t } = useTranslation();
    
    const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccountEntity[]>([]);

    const getDefaultValues = useCallback(() => {
        if ("taxDeduction" in context) {
            const deduction = context.taxDeduction;
            return {
                id: deduction.id,
                name: deduction.name,
                brokerAccount: deduction.brokerAccount,
                dateApplied: deduction.dateApplied,
                amount: deduction.amount
            };
        }

        return {
            id: generateGuid(),
            name: "",
            brokerAccount: { id: context.brokerAccountId ?? undefined },
            dateApplied: new Date(),
            amount: 0
        };
    }, [context]);

    const validationSchema = useMemo(() => getBrokerAccountTaxDeductionValidationSchema(t), [t]);

    const { register, handleSubmit, control, formState: { errors }, reset } = useForm<BrokerAccountTaxDeductionFormInput>({
        resolver: zodResolver(validationSchema),
        defaultValues: getDefaultValues()
    });

    useEffect(() => {
        reset(getDefaultValues());
    }, [reset, getDefaultValues, context]);

    const selectedBrokerAccount = useWatch({ control, name: "brokerAccount" });
    const selectedBrokerAccountEntity = findEntityById(brokerAccounts, selectedBrokerAccount?.id);
    const brokerAccountCurrency = selectedBrokerAccountEntity?.currency?.name ?? '';

    const onSubmit = async (formData: BrokerAccountTaxDeductionFormInput) => {
        await onSaved(formData as BrokerAccountTaxDeductionEntity);
        modalRef.current?.closeModal();
    };

    const handleFormSubmit: React.FormEventHandler = (event) => {
        handleSubmit(onSubmit)(event);
    };

    const onModalVisibilityChanged = (open: boolean) => {
        if (!open) {
            return;
        }

        reset(getDefaultValues());
    };

    useEffect(() => {
        let isMounted = true;
        const runAsync = async () => {
            if (!isGlobalBrokerAccount) {
                return;
            }
            const accounts = await getBrokerAccounts();
            if (isMounted) {
                setBrokerAccounts(accounts);
            }
        };

        runAsync();
        return () => {
            isMounted = false;
        };
    }, [isGlobalBrokerAccount]);

    return (
        <BaseFormModal ref={modalRef} title={t("broker_account_tax_deduction_modal_title")}
            visibilityChanged={onModalVisibilityChanged}
            submitHandler={handleFormSubmit} 
            saveButtonTitle={t("broker_account_tax_deduction_modal_deduction_button")}>
            {
                isGlobalBrokerAccount &&
                <Field.Root mt={4} invalid={!!errors.brokerAccount}>
                    <Field.Label>{t("broker_account_tax_deduction_modal_broker_account")}</Field.Label>
                    <CollectionSelect name="brokerAccount" control={control} placeholder="Select broker account"
                        collection={brokerAccounts}
                        labelSelector={(brokerAccount => brokerAccount.name)}
                        valueSelector={(brokerAccount => brokerAccount.id)} />
                    <Field.ErrorText>{errors.brokerAccount?.message}</Field.ErrorText>
                </Field.Root>
            }
            <Field.Root mt={4} invalid={!!errors.name}>
                <Field.Label>{t("broker_account_tax_deduction_modal_name")}</Field.Label>
                <Input {...register("name")} name="name" type="text" placeholder={t("broker_account_tax_deduction_modal_name_placeholder")} />
                <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root invalid={!!errors.dateApplied} mt={4}>
                <Field.Label>{t("broker_account_tax_deduction_modal_date_applied")}</Field.Label>
                <DateSelect name="dateApplied" control={control} isDateTime={true}/>
                <Field.ErrorText>{errors.dateApplied?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root mt={4} invalid={!!errors.amount}>
                <Field.Label>{t("broker_account_tax_deduction_modal_amount")}</Field.Label>
                <MoneyInput name="amount" control={control} currency={brokerAccountCurrency} placeholder="10000" />
                <Field.ErrorText>{errors.amount?.message}</Field.ErrorText>
            </Field.Root>
        </BaseFormModal>
    );
};

export default BrokerAccountTaxDeductionModal;
