import React, { RefObject, useState } from 'react'
import { useTranslation } from 'react-i18next';
import BaseFormModal from '@/shared/modals/BaseFormModal/BaseFormModal';
import { BaseModalRef } from '@/shared/utilities/modalUtilities';
import TransactionForm from '@/pages/Transactions/components/TransactionForm/TransactionForm';
import { TransactionEntity } from '@/models/transactions/TransactionEntity';
import { Nullable } from '@/shared/utilities/nullable';
import { SetSubmitHandler } from '@/pages/Transactions/modals/NewTransactionModal/NewTransactionModal';
import { FieldValues, UseFormHandleSubmit } from 'react-hook-form';

interface ModalProps {
	modalRef: RefObject<BaseModalRef | null>,
	transaction: Nullable<TransactionEntity>,
	onSaved: (transaction: TransactionEntity) => Promise<void>
}

interface State {
    formHandler?: React.FormEventHandler
}

const TransactionModal: React.FC<ModalProps> = (props: ModalProps) => {
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

    return <BaseFormModal ref={props.modalRef} title={t("entity_transaction_name_form_title")} submitHandler={onSubmit}>
        <TransactionForm transaction={props.transaction} setSubmitHandler={setSubmitHandler} onTransactionSaved={props.onSaved} />
    </BaseFormModal>
}

export default TransactionModal;