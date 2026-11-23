import { RefObject, useCallback, useEffect, useMemo } from 'react';
import { Field, Input, Flex } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from "react-hook-form";
import { getDepositValidationSchema, DepositFormInput } from "./DepositValidationSchema";
import { useTranslation } from "react-i18next";
import { useCurrencies } from "@/shared/hooks/queries/useCurrencies";
import { useBanks } from "@/shared/hooks/queries/useBanks";
import { DepositEntity } from '@/models/deposits/DepositEntity';
import CollectionSelect from '@/shared/components/CollectionSelect/CollectionSelect';
import DateSelect from '@/shared/components/DateSelect/DateSelect';
import BaseFormModal from '@/shared/modals/BaseFormModal/BaseFormModal';
import { BaseModalRef } from '@/shared/utilities/modalUtilities';
import { generateGuid } from '@/shared/utilities/idUtilities';
import MoneyInput from '@/shared/components/MoneyInput/MoneyInput';

interface ModalProps {
	modalRef: RefObject<BaseModalRef | null>,
	deposit?: DepositEntity | null,
	onSaved: (deposit: DepositEntity) => void
}

const DepositModal: React.FC<ModalProps> = ({
	modalRef,
	deposit,
	onSaved
}: ModalProps) => {
	const { data: currencies = [] } = useCurrencies();
	const { data: banks = [] } = useBanks();

	const getDefaultFormState = useCallback(() => {
		return {
			id: deposit?.id ?? generateGuid(),
			name: deposit?.name ?? "",
			bank: deposit?.bank,
			from: deposit?.from ?? new Date(),
			to: deposit?.to ?? new Date(),
			percentage: deposit?.percentage ?? 0,
			initialAmount: deposit?.initialAmount ?? 0,
			estimatedEarn: deposit?.estimatedEarn ?? 0,
			currency: deposit?.currency,
		};
	}, [deposit]);

	const { t } = useTranslation();
	const validationSchema = useMemo(() => getDepositValidationSchema(t), [t]);

	const { register, control, handleSubmit, formState: { errors }, reset } = useForm<DepositFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: getDefaultFormState()
	});

	useEffect(() => {
		reset(getDefaultFormState());
	}, [reset, getDefaultFormState, deposit]);

	const selectedCurrency = useWatch({ control, name: "currency" });
	const depositCurrency = selectedCurrency?.name ?? '';

	const onSubmit = async (savedDeposit: DepositFormInput) => {
		await onSaved(savedDeposit as DepositEntity);
		modalRef?.current?.closeModal();
	};

	const handleFormSubmit: React.FormEventHandler = (event) => {
		handleSubmit(onSubmit)(event);
	};

	return <BaseFormModal ref={modalRef} title={t("entity_deposit_name_form_title")} submitHandler={handleFormSubmit}>
		<Field.Root invalid={!!errors.name}>
			<Field.Label>{t("entity_deposit_name")}</Field.Label>
			<Input {...register("name")} autoComplete="off" placeholder='Deposit name' />
			<Field.ErrorText>{errors.name?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root mt={4} invalid={!!errors.bank}>
			<Field.Label>{t("entity_deposit_bank")}</Field.Label>
			<CollectionSelect name="bank" control={control} placeholder="Select bank"
				collection={banks}
				labelSelector={(bank => bank.name)}
				valueSelector={(bank => bank.id)} />
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
				collection={currencies}
				labelSelector={(currency => currency.name)}
				valueSelector={(currency => currency.id)} />
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
				<DateSelect name="from" control={control} />
				<Field.ErrorText>{errors.from?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root invalid={!!errors.to} mt={4}>
				<Field.Label>{t("entity_deposit_to")}</Field.Label>
				{/* TODO Fix date field duplication */}
				<DateSelect name="to" control={control} />
				<Field.ErrorText>{errors.to?.message}</Field.ErrorText>
			</Field.Root>
		</Flex>
	</BaseFormModal>;
};

export default DepositModal;