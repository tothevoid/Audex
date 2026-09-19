import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Field, Input } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { getTransactionValidationSchema, TransactionFormInput } from './TransactionValidationSchema';
import { useForm, } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { getTransactionTypes } from '../../../../api/transactions/transactionTypeApi';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import { TransactionEntity } from '../../../../models/transactions/TransactionEntity';
import { TransactionTypeEntity } from '../../../../models/transactions/TransactionTypeEntity';
import CollectionSelect from '../../../../shared/components/CollectionSelect/CollectionSelect';
import DateSelect from '../../../../shared/components/DateSelect/DateSelect';
import MoneyInput from '../../../../shared/components/MoneyInput/MoneyInput';
import { getAccounts } from '../../../../api/accounts/accountApi';
import { generateGuid } from '../../../../shared/utilities/idUtilities';
import { Nullable } from '../../../../shared/utilities/nullable';
import { SetSubmitHandler } from '../../modals/NewTransactionModal/NewTransactionModal';

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

const TransactionForm: React.FC<ModalProps> = (props: ModalProps) => {
	const {t} = useTranslation();

	const [state, setState] = useState<State>({transactionTypes: [], accounts: []});

	const amount = props.transaction?.amount ? 
		Math.abs(props.transaction.amount) :
		0;

	const transactionOptions = {
		[TransactionDirection.Income]: { label: t("entity_transaction_direction_income"), value: TransactionDirection.Income },
		[TransactionDirection.Spent]: { label: t("entity_transaction_direction_outcome"), value: TransactionDirection.Spent },
	} as const;

	const direction = props.transaction && props.transaction.amount > 0 ?
		transactionOptions[TransactionDirection.Income]:
		transactionOptions[TransactionDirection.Spent];

	const source = (state.accounts?.length > 0) ? 
		state.accounts[0] :
		{id: ""} as AccountEntity;

	const getDefaultTransactionFormValues = useCallback(() => {
		return {
			id: props.transaction?.id ?? generateGuid(),
			name: props.transaction?.name ?? "",
			date: props.transaction?.date ?? new Date(),
			amount,
			account: props.transaction?.account ?? source,
			direction: direction,
			cashback: props.transaction?.cashback ?? 0,
			isSystem: props.transaction?.isSystem ?? false,
			transactionType: props.transaction?.transactionType
		}
	}, [props.transaction]);

	const validationSchema = useMemo(() => getTransactionValidationSchema(t), [t]);

	const { register, handleSubmit, watch, control, formState: { errors }, reset} = useForm<TransactionFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: getDefaultTransactionFormValues()
	});

	useEffect(() => {
		reset(getDefaultTransactionFormValues())
	}, [props.transaction, reset, getDefaultTransactionFormValues]);

	const initCollections = async () => {
		const transactionTypes = await getTransactionTypes(true);
		const accounts = await getAccounts({ onlyActive: true });

		setState((currentState) => {
			return {...currentState, transactionTypes, accounts}
		})
	};

	const onTransactionSaveClick = async (transaction: TransactionFormInput) => {
		const multiplier = transaction.direction.value == TransactionDirection.Income ?
			1:
			-1;

		const transactionEntity: TransactionEntity = {
			id: transaction.id!, 
			name: transaction.name,
			amount: multiplier * transaction.amount,
			account: state.accounts.find(account => account.id === transaction.account.id)!,
			isSystem: transaction.isSystem,
			date: transaction.date,
			cashback: transaction.cashback,
			transactionType: state.transactionTypes.find(transactionType => transactionType.id === transaction.transactionType.id)!,
		}

		await props.onTransactionSaved(transactionEntity);
	};
	
	useEffect(() => {
		const initData = async () => {
			await initCollections();
		}

		initData();
	}, []);

	useEffect(() => {
		props.setSubmitHandler(handleSubmit, onTransactionSaveClick);
	}, [state]);

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
				collection={Object.values(transactionOptions)} 
				labelSelector={(currency => currency.label)} 
				valueSelector={(currency => currency.value)}/>
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
	</Fragment>
}

export default TransactionForm;