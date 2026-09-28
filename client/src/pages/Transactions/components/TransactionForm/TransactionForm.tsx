import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Field, Input } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { getTransactionValidationSchema, TransactionFormInput } from './TransactionValidationSchema';
import { useForm, } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { getTransactionTypes } from '@/api/transactions/transactionTypeApi';
import { AccountEntity } from '@/models/accounts/AccountEntity';
import { TransactionEntity } from '@/models/transactions/TransactionEntity';
import { TransactionTypeEntity } from '@/models/transactions/TransactionTypeEntity';
import CollectionSelect from '@/shared/components/CollectionSelect/CollectionSelect';
import DateSelect from '@/shared/components/DateSelect/DateSelect';
import MoneyInput from '@/shared/components/MoneyInput/MoneyInput';
import { getAccounts } from '@/api/accounts/accountApi';
import { generateGuid } from '@/shared/utilities/idUtilities';
import { Nullable } from '@/shared/utilities/nullable';
import { SetSubmitHandler } from '@/pages/Transactions/modals/NewTransactionModal/NewTransactionModal';

interface ModalProps {
	setSubmitHandler: SetSubmitHandler,
	transaction?: Nullable<TransactionEntity>,
	onTransactionSaved: (transaction: TransactionEntity) => Promise<void>
}

interface State {
	transactionTypes: TransactionTypeEntity[],
	accounts: AccountEntity[]
}

enum TransactionDirection {
	Income = "income",
	Spent = "spent",
}

const TransactionForm: React.FC<ModalProps> = ({ transaction, onTransactionSaved, setSubmitHandler }: ModalProps) => {
	const {t} = useTranslation();

	const [state, setState] = useState<State>({transactionTypes: [], accounts: []});

	const transactionOptions = useMemo(() => [
		{ label: t("entity_transaction_direction_income"), value: TransactionDirection.Income },
		{ label: t("entity_transaction_direction_outcome"), value: TransactionDirection.Spent },
	], [t]);

	const getDefaultTransactionFormValues = useCallback(() => {
		const amount = transaction?.amount ? 
			Math.abs(transaction.amount) :
			0;

		const direction = transaction && transaction.amount > 0 ?
			transactionOptions[0]:
			transactionOptions[1];

		const source = (state.accounts?.length > 0) ? 
			state.accounts[0] :
			{id: ""} as AccountEntity;

		return {
			id: transaction?.id ?? generateGuid(),
			name: transaction?.name ?? "",
			date: transaction?.date ?? new Date(),
			amount,
			account: transaction?.account ?? source,
			direction: direction,
			cashback: transaction?.cashback ?? 0,
			isSystem: transaction?.isSystem ?? false,
			transactionType: transaction?.transactionType
		};
	}, [transaction, state.accounts, transactionOptions]);

	const validationSchema = useMemo(() => getTransactionValidationSchema(t), [t]);

	const { register, handleSubmit, watch, control, formState: { errors }, reset} = useForm<TransactionFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: getDefaultTransactionFormValues()
	});

	useEffect(() => {
		reset(getDefaultTransactionFormValues());
	}, [transaction, reset, getDefaultTransactionFormValues]);

	const onTransactionSaveClick = useCallback(async (formTransaction: TransactionFormInput) => {
		const multiplier = formTransaction.direction.value === TransactionDirection.Income ?
			1:
			-1;

		const transactionEntity: TransactionEntity = {
			id: formTransaction.id!, 
			name: formTransaction.name,
			amount: multiplier * formTransaction.amount,
			account: state.accounts.find(account => account.id === formTransaction.account.id)!,
			isSystem: formTransaction.isSystem,
			date: formTransaction.date,
			cashback: formTransaction.cashback,
			transactionType: state.transactionTypes.find(transactionType => transactionType.id === formTransaction.transactionType.id)!,
		};

		await onTransactionSaved(transactionEntity);
	}, [onTransactionSaved, state.accounts, state.transactionTypes]);
	
	useEffect(() => {
		const initData = async () => {
			const transactionTypes = await getTransactionTypes(true);
			const accounts = await getAccounts({ onlyActive: true });

			setState((currentState) => {
				return {...currentState, transactionTypes, accounts};
			});
		};

		initData();
	}, []);

	useEffect(() => {
		setSubmitHandler(handleSubmit, onTransactionSaveClick);
	}, [handleSubmit, onTransactionSaveClick, setSubmitHandler]);

	const selectedDirection = watch("direction");
	const selectedAccount = watch("account");
	const currentCurrency = state.accounts.find(account => account.id === selectedAccount?.id)?.currency?.name ?? '';

	return <Fragment>
		<Field.Root invalid={!!errors.name}>
			<Field.Label>{t("entity_transaction_name")}</Field.Label>
			<Input {...register("name")} autoComplete="off" placeholder='Grocery' />
		</Field.Root>
		<Field.Root mt={4}>
			<Field.Label>{t("entity_transaction_direction")}</Field.Label>
			<CollectionSelect name="direction" control={control} placeholder="Select direction"
				collection={transactionOptions} 
				labelSelector={(option => option.label)} 
				valueSelector={(option => option.value)}/>
		</Field.Root>
		<Field.Root mt={4} invalid={!!errors.amount}>
			<Field.Label>{t("entity_transaction_money_quantity")}</Field.Label>
			<MoneyInput name="amount" control={control} currency={currentCurrency} placeholder='500' />
			<Field.ErrorText>{errors.amount?.message}</Field.ErrorText>
		</Field.Root>
		{
			selectedDirection.value === TransactionDirection.Spent ?
				<Field.Root mt={4} invalid={!!errors.cashback}>
					<Field.Label>{t("entity_transaction_cashback")}</Field.Label>
					<MoneyInput name="cashback" control={control} currency={currentCurrency} placeholder='100' />
					<Field.ErrorText>{errors.cashback?.message}</Field.ErrorText>
				</Field.Root>:
				<Fragment/>
		}
		<Field.Root mt={4} invalid={!!errors.date}>
			<Field.Label>{t("entity_transaction_date")}</Field.Label>
			<DateSelect name="date" control={control}/>
			<Field.ErrorText>{errors.date?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root mt={4} invalid={!!errors.account}>
			<Field.Label>{t("entity_transaction_account")}</Field.Label>
			<CollectionSelect name="account" control={control} placeholder="Select account"
				collection={state.accounts} 
				labelSelector={(currency => currency.name)} 
				valueSelector={(currency => currency.id)}/>
			<Field.ErrorText>{errors.account?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root mt={4} invalid={!!errors.transactionType}>
			<Field.Label>{t("entity_transaction_transaction_type")}</Field.Label>
			<CollectionSelect name="transactionType" control={control} placeholder="Select type"
				collection={state.transactionTypes} 
				labelSelector={(transactionType => transactionType.name)} 
				valueSelector={(transactionType => transactionType.id)}/>
			<Field.ErrorText>{errors.transactionType?.message}</Field.ErrorText>
		</Field.Root>
	</Fragment>;
};

export default TransactionForm;