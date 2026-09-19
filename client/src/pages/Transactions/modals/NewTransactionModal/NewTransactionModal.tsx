import React, { RefObject, useEffect, useState } from 'react'
import { Tabs } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import BaseFormModal from '../../../../shared/modals/BaseFormModal/BaseFormModal';
import { BaseModalRef } from '../../../../shared/utilities/modalUtilities';
import { getAccounts } from '../../../../api/accounts/accountApi';
import CurrencyTransactionForm from '../../components/CurrencyTransactionForm/CurrencyTransactionForm';
import TransactionForm from '../../components/TransactionForm/TransactionForm';
import { TransactionEntity } from '../../../../models/transactions/TransactionEntity';
import { CurrencyTransactionEntity } from '../../../../models/transactions/CurrencyTransactionEntity';
import { MdCurrencyExchange } from 'react-icons/md';
import { GrTransaction } from 'react-icons/gr';
import { FieldValues, UseFormHandleSubmit } from 'react-hook-form';

export type SetSubmitHandler = <T extends FieldValues>(submit: UseFormHandleSubmit<T>, handler: (data: T) => Promise<void>) => Promise<void>;

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>
    onTransactionSaved: (transaction: TransactionEntity) => Promise<void>
    onCurrencyTransactionSaved: (currencyTransaction: CurrencyTransactionEntity) => Promise<void>
}

interface State {
    accounts: AccountEntity[],
    activeFormHandler?: React.FormEventHandler
}

const NewTransactionModal: React.FC<ModalProps> = (props: ModalProps) => {
    const { t } = useTranslation();

    const [state, setState] = useState<State>({ accounts: [] });

    const initAccounts = async () => {
        const accounts = await getAccounts({ onlyActive: true });
        setState((currentState) => {
            return { ...currentState, accounts };
        });
    };

    const setSubmitHandler: SetSubmitHandler = async <T extends FieldValues>(submit: UseFormHandleSubmit<T>, handler: (data: T) => Promise<void>) => {
        const wrappedHandler = async (data: T) => {
            await handler(data);
            props.modalRef?.current?.closeModal();
        };

        setState((currentState) => {
            return { ...currentState, activeFormHandler: submit(wrappedHandler) };
        });
    };

    useEffect(() => {
        const initData = async () => {
            await initAccounts();
        };
        initData();
    }, []);

    const onSubmit = async (event: React.FormEvent) => {
        if (!state.activeFormHandler) {
            return;
        }

        await state.activeFormHandler(event);
    };

    return (
        <BaseFormModal ref={props.modalRef} size="xl" title={t("new_transaction_form_title")} submitHandler={onSubmit}>
            <Tabs.Root lazyMount={true} unmountOnExit={true} defaultValue="base" variant="enclosed">
                <Tabs.List>
                    <Tabs.Trigger value="base">
                        <GrTransaction />
                        {t("new_transaction_account_transaction_title")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="currency">
                        <MdCurrencyExchange />
                        {t("new_transaction_account_currency_title")}
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="base">
                    <TransactionForm setSubmitHandler={setSubmitHandler} onTransactionSaved={props.onTransactionSaved} />
                </Tabs.Content>
                <Tabs.Content value="currency">
                    <CurrencyTransactionForm setSubmitHandler={setSubmitHandler} onCurrencyTransactionSaved={props.onCurrencyTransactionSaved} />
                </Tabs.Content>
            </Tabs.Root>
        </BaseFormModal>
    );
};

export default NewTransactionModal;