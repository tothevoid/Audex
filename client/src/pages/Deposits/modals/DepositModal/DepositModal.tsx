import { RefObject, useCallback, useEffect, useMemo, useState } from 'react'
import { Field, Input, Flex} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from "react-hook-form";
import { getDepositValidationSchema, DepositFormInput } from "./DepositValidationSchema";
import { useTranslation } from "react-i18next";
import { getCurrencies } from '@/api/currencies/currencyApi';
import { CurrencyEntity } from '@/models/currencies/CurrencyEntity';
import { DepositEntity } from '@/models/deposits/DepositEntity';
import CollectionSelect from '@/shared/components/CollectionSelect/CollectionSelect';
import DateSelect from '@/shared/components/DateSelect/DateSelect';
import BaseFormModal from '@/shared/modals/BaseFormModal/BaseFormModal';
import { BaseModalRef } from '@/shared/utilities/modalUtilities';
import { generateGuid } from '@/shared/utilities/idUtilities';
import { BankEntity } from '@/models/banks/BankEntity';
import { getBanks } from '@/api/banks/bankApi';
import MoneyInput from '@/shared/components/MoneyInput/MoneyInput';

interface ModalProps {
	modalRef: RefObject<BaseModalRef | null>,
	deposit?: DepositEntity | null,
	onSaved: (deposit: DepositEntity) => void
}

interface State {
	currencies: CurrencyEntity[],
	banks: BankEntity[]
}

const DepositModal: React.FC<ModalProps> = (props: ModalProps) => {
	const [state, setState] = useState<State>({ currencies: [], banks: [] });

	const initCurrencies = async () => {
		const currencies = await getCurrencies();
		setState((currentState) => {
			return {...currentState, currencies}
		})
	};

	const initBanks = async () => {
		const banks = await getBanks();
		setState((currentState) => {
			return {...currentState, banks}
		})
	};
	
	useEffect(() => {
		const initData = async () => {
			await initCurrencies();
			await initBanks();
		}
		initData();
	}, []);

	const getDefaultFormState = useCallback(() => {
		return {
			id: props.deposit?.id ?? generateGuid(),
			name: props.deposit?.name ?? "",
			bank: props.deposit?.bank,
			from: props.deposit?.from ?? new Date(),
			to: props.deposit?.to ?? new Date(),
			percentage: props.deposit?.percentage ?? 0,
			initialAmount: props.deposit?.initialAmount ?? 0,
			estimatedEarn: props.deposit?.estimatedEarn ?? 0,
			currency: props.deposit?.currency,
		}
	}, [props.deposit])

	const { t } = useTranslation();
	const validationSchema = useMemo(() => getDepositValidationSchema(t), [t]);

	const { register, control, handleSubmit, watch, formState: { errors }, reset} = useForm<DepositFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: getDefaultFormState()
	});

	useEffect(() => {
		reset(getDefaultFormState())
	}, [reset, getDefaultFormState, props.deposit])

	const selectedCurrencyForm = watch("currency");
	const depositCurrency = state.currencies.find(c => c.id === selectedCurrencyForm?.id)?.name ?? '';

	const onSubmit = async (deposit: DepositFormInput) => {
		await props.onSaved(deposit as DepositEntity);
		props.modalRef?.current?.closeModal();
	}

	return <BaseFormModal ref={props.modalRef} title={t("entity_deposit_name_form_title")} submitHandler={handleSubmit(onSubmit)}>
		<Field.Root invalid={!!errors.name}>
			<Field.Label>{t("entity_deposit_name")}</Field.Label>
			<Input {...register("name")} autoComplete="off" placeholder='Deposit name' />
			<Field.ErrorText>{errors.name?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root mt={4} invalid={!!errors.bank}>
			<Field.Label>{t("entity_deposit_bank")}</Field.Label>
			<CollectionSelect name="bank" control={control} placeholder="Select bank"
				collection={state.banks} 
				labelSelector={(bank => bank.name)} 
				valueSelector={(bank => bank.id)}/>
			<Field.ErrorText>{errors.bank?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root invalid={!!errors.percentage} mt={4}>
			<Field.Label>{t("entity_deposit_percentage")}</Field.Label>
			<MoneyInput name="percentage" control={control} currency="%" showWordsHelper={false} placeholder='10' />
			<Field.ErrorText>{errors.percentage?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root mt={4} invalid={!!errors.currency}>
			<Field.Label>{t("entity_transaction_currency")}</Field.Label>
			<CollectionSelect name="currency" control={control} placeholder="Select currency"
				collection={state.currencies} 
				labelSelector={(currency => currency.name)} 
				valueSelector={(currency => currency.id)}/>
			<Field.ErrorText>{errors.currency?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root invalid={!!errors.initialAmount} mt={4}>
			<Field.Label>{t("entity_deposit_initial_amount")}</Field.Label>
			<MoneyInput name="initialAmount" control={control} currency={depositCurrency} placeholder='10' />
			<Field.ErrorText>{errors.initialAmount?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root invalid={!!errors.estimatedEarn} mt={4}>
			<Field.Label>{t("entity_deposit_estimated_earn")}</Field.Label>
			<MoneyInput name="estimatedEarn" control={control} currency={depositCurrency} placeholder='10' />
			<Field.ErrorText>{errors.estimatedEarn?.message}</Field.ErrorText>
		</Field.Root>
		<Flex gap={4} direction="row">
			<Field.Root invalid={!!errors.from} mt={4}>
				<Field.Label>{t("entity_deposit_from")}</Field.Label>
				<DateSelect name="from" control={control}/>
				<Field.ErrorText>{errors.from?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root invalid={!!errors.to} mt={4}>
				<Field.Label>{t("entity_deposit_to")}</Field.Label>
				{/* TODO Fix date field duplication */}
				<DateSelect name="to" control={control}/>
				<Field.ErrorText>{errors.to?.message}</Field.ErrorText>
			</Field.Root>
		</Flex>
	</BaseFormModal>	
}

export default DepositModal;