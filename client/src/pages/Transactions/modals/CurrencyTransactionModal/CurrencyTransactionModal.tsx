import React, { RefObject, useState } from 'react'
import { useTranslation } from 'react-i18next';
import BaseFormModal from '@/shared/modals/BaseFormModal/BaseFormModal';
import { BaseModalRef } from '@/shared/utilities/modalUtilities';
import CurrencyTransactionForm from '@/pages/Transactions/components/CurrencyTransactionForm/CurrencyTransactionForm';
import { CurrencyTransactionEntity } from '@/models/transactions/CurrencyTransactionEntity';
import { AccountEntity } from '@/models/accounts/AccountEntity';
import { FieldValues, UseFormHandleSubmit } from 'react-hook-form';
import { SetSubmitHandler } from '@/pages/Transactions/modals/NewTransactionModal/NewTransactionModal';

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>,
    currencyTransaction?: CurrencyTransactionEntity | null,
    currentAccount?: AccountEntity | null,
    onSaved: (transaction: CurrencyTransactionEntity) => Promise<void>
}

interface State {
    formHandler?: React.FormEventHandler
}

const CurrencyTransactionModal: React.FC<ModalProps> = (props: ModalProps) => {
    const {t} = useTranslation();

    const [state, setState] = useState<State>({});

    const setSubmitHandler: SetSubmitHandler = async <T extends FieldValues>(submit: UseFormHandleSubmit<T>, handler: (data: T) => Promise<void>) => {
        const wrappedHandler = async (data: T) => {
            await handler(data);
            props.modalRef?.current?.closeModal();
        }


        setState((currentState) => {
            return {...currentState, formHandler: submit(wrappedHandler)}
        })
    }
    
    const onSubmit = (event: React.FormEvent) => {
        if (!state.formHandler) {
            return;
        }

        state.formHandler(event);
    }

    return <BaseFormModal ref={props.modalRef} size="xl" title={t("currency_transaction_modal_title")} submitHandler={onSubmit}>
        <CurrencyTransactionForm currencyTransaction={props.currencyTransaction} currentAccount={props.currentAccount} setSubmitHandler={setSubmitHandler} onCurrencyTransactionSaved={props.onSaved} />
    </BaseFormModal>
}

export default CurrencyTransactionModal;