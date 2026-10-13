import { Field } from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { getAccounts } from "@/api/accounts/accountApi";
import { AccountEntity } from "@/models/accounts/AccountEntity";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import { useTranslation } from "react-i18next";
import { BrokerAccountFundTransferEntity } from "@/models/brokers/BrokerAccountFundTransfer";
import { generateGuid } from "@/shared/utilities/idUtilities";
import DateSelect from "@/shared/components/DateSelect/DateSelect";
import MoneyInput from "@/shared/components/MoneyInput/MoneyInput";
import { BrokerAccountFundTransferFormInput, getBrokerAccountFundTransferValidationSchema } from "./BrokerAccountFundTransferValidationSchema";
import { getBrokerAccounts } from "@/api/brokers/brokerAccountApi";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";

import { Nullable } from "@/shared/utilities/nullable";

export interface CreateBrokerAccountFundTransferContext {
    brokerAccountId?: Nullable<string>;
}

export interface EditBrokerAccountFundTransferContext {
    brokerAccountFundTransfer: BrokerAccountFundTransferEntity
}

interface ModalProps {
    isGlobalBrokerAccount: boolean;
    onSaved: (transfer: BrokerAccountFundTransferEntity) => void;
    context: CreateBrokerAccountFundTransferContext | EditBrokerAccountFundTransferContext;
    modalRef: RefObject<BaseModalRef | null>;
}

interface TransferType {
    label: string;
    value: boolean;
}

const BrokerAccountFundTransferModal: React.FC<ModalProps> = ({
    isGlobalBrokerAccount,
    onSaved,
    context,
    modalRef
}: ModalProps) => {
    const [accounts, setAccounts] = useState<AccountEntity[]>([]);
    const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccountEntity[]>([]);

    const { t } = useTranslation();

    const transferTypes: TransferType[] = useMemo(
        () => [
            { label: t("broker_account_transfer_modal_operation_deposit"), value: true },
            { label: t("broker_account_transfer_modal_operation_withdraw"), value: false }
        ],
        [t]
    );
    
    const getDefaultValues = useCallback(() => {
        if ("brokerAccountFundTransfer" in context) {
            const transfer = context.brokerAccountFundTransfer;
            const transferType = transferTypes.find(transferTypeItem => transferTypeItem.value === transfer.income) ?? transferTypes[0];
            return {
                id: transfer.id,
                account: transfer.account,
                brokerAccount: transfer.brokerAccount,
                income: transferType,
                date: transfer.date,
                amount: transfer.amount
            };
        }

        return {
            id: generateGuid(),
            account: undefined,
            brokerAccount: { id: context.brokerAccountId ?? undefined },
            income: transferTypes[0],
            date: new Date(),
            amount: 0
        };
    }, [context, transferTypes]);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            if (isGlobalBrokerAccount) {
                const [fetchedAccounts, fetchedBrokerAccounts] = await Promise.all([
                    getAccounts({ onlyActive: true }),
                    getBrokerAccounts()
                ]);

                if (isMounted) {
                    setAccounts(fetchedAccounts);
                    setBrokerAccounts(fetchedBrokerAccounts);
                }
            } else {
                const fetchedAccounts = await getAccounts({ onlyActive: true });

                if (isMounted) {
                    setAccounts(fetchedAccounts);
                }
            }
        };
        fetchData();
        return () => {
            isMounted = false;
        };
    }, [isGlobalBrokerAccount]);

    const validationSchema = useMemo(() => getBrokerAccountFundTransferValidationSchema(t), [t]);

    const { handleSubmit, control, formState: { errors }, reset } = useForm<BrokerAccountFundTransferFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: getDefaultValues()
    });

    const incomeValue = useWatch({ control, name: "income" }); 
    const selectedBrokerAccount = useWatch({ control, name: "brokerAccount" });
    const selectedAccount = useWatch({ control, name: "account" });
    const transferCurrency = brokerAccounts.find(brokerAccount => brokerAccount.id === selectedBrokerAccount?.id)?.currency?.name ?? accounts.find(account => account.id === selectedAccount?.id)?.currency?.name ?? '';
    const accountLabel = incomeValue?.value ? t("broker_account_transfer_modal_account_from") : t("broker_account_transfer_modal_account_to");

    useEffect(() => {
        reset(getDefaultValues());
    }, [reset, getDefaultValues, context]);

    const onSubmit = async (formData: BrokerAccountFundTransferFormInput) => {
        const transfer = {...formData, income: formData.income.value} as BrokerAccountFundTransferEntity;
        await onSaved(transfer);
        modalRef.current?.closeModal();
    };

    const onModalVisibilityChanged = (open: boolean) => {
        if (!open) {
            return;
        }

        reset(getDefaultValues());
    };

    const handleFormSubmit: React.FormEventHandler = (event) => {
        handleSubmit(onSubmit)(event);
    };

    return (
        <BaseFormModal ref={modalRef} title={t("broker_account_transfer_modal_title")}
            visibilityChanged={onModalVisibilityChanged}
            submitHandler={handleFormSubmit} 
            saveButtonTitle={t("broker_account_transfer_modal_transfer_button")}>
            {
                isGlobalBrokerAccount &&
                <Field.Root mt={4} invalid={!!errors.brokerAccount}>
                    <Field.Label>{t("broker_account_transfer_modal_broker_account")}</Field.Label>
                    <CollectionSelect name="brokerAccount" control={control} placeholder="Select broker account"
                        collection={brokerAccounts}
                        labelSelector={(brokerAccount => brokerAccount.name)}
                        valueSelector={(brokerAccount => brokerAccount.id)} />
                    <Field.ErrorText>{errors.brokerAccount?.message}</Field.ErrorText>
                </Field.Root>
            }
            <Field.Root mt={4} invalid={!!errors.income}>
                <Field.Label>{t("broker_account_transfer_modal_operation")}</Field.Label>
                <CollectionSelect name="income" control={control} placeholder="Select type"
                    collection={transferTypes}
                    labelSelector={(transferType => transferType.label)}
                    valueSelector={(transferType => String(transferType.value))} />
                <Field.ErrorText>{errors.income?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root mt={4} invalid={!!errors.account}>
                <Field.Label>{accountLabel}</Field.Label>
                <CollectionSelect name="account" control={control} placeholder="Select account"
                    collection={accounts}
                    labelSelector={(account => account.name)}
                    valueSelector={(account => account.id)} />
                <Field.ErrorText>{errors.account?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root invalid={!!errors.date} mt={4}>
                <Field.Label>{t("broker_account_transfer_modal_date")}</Field.Label>
                <DateSelect name="date" control={control} isDateTime={true}/>
                <Field.ErrorText>{errors.date?.message}</Field.ErrorText>
            </Field.Root>
            <Field.Root mt={4} invalid={!!errors.amount}>
                <Field.Label>{t("broker_account_transfer_modal_amount")}</Field.Label>
                <MoneyInput name="amount" control={control} currency={transferCurrency} placeholder="10000" />
                <Field.ErrorText>{errors.amount?.message}</Field.ErrorText>
            </Field.Root>
        </BaseFormModal>
    );
};

export default BrokerAccountFundTransferModal;
