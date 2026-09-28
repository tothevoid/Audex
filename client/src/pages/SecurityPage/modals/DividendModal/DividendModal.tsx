import React, { RefObject, useCallback, useEffect, useMemo } from 'react'
import { Field } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import DateSelect from "@/shared/components/DateSelect/DateSelect";
import { DividendEntity } from '@/models/securities/DividendEntity';
import { DividendFormInput, getDividendValidationSchema } from './DividendValidationSchema';
import { BaseModalRef } from '@/shared/utilities/modalUtilities';
import BaseFormModal from '@/shared/modals/BaseFormModal/BaseFormModal';
import MoneyInput from '@/shared/components/MoneyInput/MoneyInput';
import { generateGuid } from '@/shared/utilities/idUtilities';

export interface CreateDividendContext {
	securityId: string
}

export interface EditDividendContext {
	dividend: DividendEntity
}

interface ModalProps {
	modalRef: RefObject<BaseModalRef | null>,
	onSaved: (dividend: DividendEntity) => void,
	context: CreateDividendContext | EditDividendContext,
	currencyName?: string
}

const DividendModal: React.FC<ModalProps> = (props: ModalProps) => {
	const {t} = useTranslation();

	const getDefaultFormValues = useCallback(() => {
		const dividend = "dividend" in props.context ? props.context.dividend : null;
		const security = "securityId" in props.context ? { id: props.context.securityId }: { id: undefined};

		return {
			id: dividend?.id ?? generateGuid(),
			security: dividend?.security ?? security,
			amount: dividend?.amount ?? 0,
			declarationDate: dividend?.declarationDate ?? new Date(),
			snapshotDate: dividend?.snapshotDate ?? new Date()
		}
	}, [props.context])

	const validationSchema = useMemo(() => getDividendValidationSchema(t), [t]);

	const { control, handleSubmit, formState: { errors }, reset} = useForm<DividendFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: getDefaultFormValues()
	});

	useEffect(() => {
		reset(getDefaultFormValues());
	}, [reset, getDefaultFormValues, props.context]);

	const onSubmit = (dividend: DividendFormInput) => {
		props.onSaved(dividend as DividendEntity);
		props.modalRef?.current?.closeModal();
	}

	return <BaseFormModal ref={props.modalRef} title={t("entity_dividend_form_title")} submitHandler={handleSubmit(onSubmit)}>
		<Field.Root invalid={!!errors.amount} mt={4}>
			<Field.Label>{t("entity_dividend_security_amount")}</Field.Label>
			<MoneyInput
				name="amount"
				control={control}
				placeholder="10"
				currency={props.currencyName ?? ''}
			/>
			<Field.ErrorText>{errors.amount?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root invalid={!!errors.declarationDate} mt={4}>
			<Field.Label>{t("entity_dividend_declaration_date")}</Field.Label>
			<DateSelect name="declarationDate" control={control}/>
			<Field.ErrorText>{errors.declarationDate?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root invalid={!!errors.snapshotDate} mt={4}>
			<Field.Label>{t("entity_dividend_snapshot_date")}</Field.Label>
			<DateSelect name="snapshotDate" control={control}/>
			<Field.ErrorText>{errors.snapshotDate?.message}</Field.ErrorText>
		</Field.Root>
	</BaseFormModal>
}

export default DividendModal;