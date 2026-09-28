import { Field, Input } from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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

export interface CreateBrokerAccountTaxDeductionContext {
    brokerAccountId: string
}

export interface EditBrokerAccountTaxDeductionContext {
    taxDeduction: BrokerAccountTaxDeductionEntity
}

interface ModalProps {
    isGlobalBrokerAccount: boolean
    onSaved: (taxDeduction: BrokerAccountTaxDeductionEntity) => void
    context: CreateBrokerAccountTaxDeductionContext | EditBrokerAccountTaxDeductionContext
    modalRef: RefObject<BaseModalRef | null>}

const BrokerAccountTaxDeductionModal: React.FC<ModalProps> = (props: ModalProps) => {
    const { t } = useTranslation();
    
    const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccountEntity[]>([]);

    const getDefaultValues = useCallback(() => {
        const taxDeduction = "taxDeduction" in props.context ? props.context.taxDeduction: null;
        
        const brokerAccount = "brokerAccountId" in props.context ? 
            { id: props.context.brokerAccountId }: 
            { id: props.context.taxDeduction.brokerAccount.id};
                
        return {
            id: taxDeduction?.id ?? generateGuid(),
            name: taxDeduction?.name ?? "",
            brokerAccount: taxDeduction?.brokerAccount ?? brokerAccount,
            dateApplied: taxDeduction?.dateApplied ?? new Date(),
            amount: taxDeduction?.amount ?? 0
        };
    }, [props.context]);

    const validationSchema = useMemo(() => getBrokerAccountTaxDeductionValidationSchema(t), [t]);

    const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<BrokerAccountTaxDeductionFormInput>({
        resolver: zodResolver(validationSchema),
        defaultValues: getDefaultValues()
    });

    useEffect(() => {
        reset(getDefaultValues());
    }, [reset, getDefaultValues, props.context]);

    const selectedBrokerAccount = watch("brokerAccount");
    const brokerAccountCurrency = brokerAccounts.find(ba => ba.id === selectedBrokerAccount?.id)?.currency?.name ?? '';

    const onSubmit = async (formData: BrokerAccountTaxDeductionFormInput) => {
        props.onSaved(formData as BrokerAccountTaxDeductionEntity);
        props.modalRef.current?.closeModal();
    };

    const onModalVisibilityChanged = async (open: boolean) => {
        if (!open) {
            return;
        }

        reset(getDefaultValues());
    };

    useEffect(() => {
        const runAsync = async () => {
            if (!props.isGlobalBrokerAccount) {
                return;
            }
            const brokerAccounts = await getBrokerAccounts();
            setBrokerAccounts(brokerAccounts);
        };

        runAsync();
    }, []);

    return (
        <BaseFormModal ref={props.modalRef} title={t("broker_account_tax_deduction_modal_title")}
            visibilityChanged={onModalVisibilityChanged}
            submitHandler={handleSubmit(onSubmit)} 
            saveButtonTitle={t("broker_account_tax_deduction_modal_deduction_button")}>
            {
                props.isGlobalBrokerAccount &&
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
