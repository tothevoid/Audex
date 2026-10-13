import { Field, Input, Stack } from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import { getCurrencies } from "@/api/currencies/currencyApi";
import { getUserProfile } from "@/api/user/userProfileApi";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { DebtFormInput, getDebtValidationSchema } from "./DebtValidationSchema";
import { DebtEntity } from "@/models/debts/DebtEntity";
import DateSelect from "@/shared/components/DateSelect/DateSelect";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { generateGuid } from "@/shared/utilities/idUtilities";
import { findEntityById } from "@/shared/utilities/arrayUtilities";
import MoneyInput from "@/shared/components/MoneyInput/MoneyInput";

interface Props {
	debt?: DebtEntity | null,
	modalRef: RefObject<BaseModalRef | null>,
	onSaved: (debt: DebtEntity) => void
};

interface State {
	currencies: CurrencyEntity[],
	profileCurrency?: CurrencyEntity
}

const DebtModal: React.FC<Props> = ({
	debt,
	modalRef,
	onSaved,
}: Props) => {
	const [state, setState] = useState<State>({ currencies: [] });

	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			const [currencies, userProfile] = await Promise.all([
				getCurrencies(),
				getUserProfile()
			]);
			if (isMounted) {
				const profileCurrency = userProfile ? userProfile.currency : currencies[0];
				setState({ currencies, profileCurrency });
			}
		};
		loadData();
		return () => {
			isMounted = false;
		};
	}, []);

	const getDefaultFormState = useCallback(() => {
		const matchedCurrency = findEntityById(
			state.currencies,
			debt?.currency?.id,
			debt?.currency
		) ?? state.profileCurrency ?? state.currencies[0];

		return {
			id: debt?.id ?? generateGuid(),
			name: debt?.name ?? "",
			amount: debt?.amount ?? 0,
			currency: matchedCurrency,
			date: debt?.date ?? new Date()
		};
	}, [debt, state.profileCurrency, state.currencies]);

	const { t } = useTranslation();
	const validationSchema = useMemo(() => getDebtValidationSchema(t), [t]);

	const { register, handleSubmit, control, formState: { errors }, reset } = useForm<DebtFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: getDefaultFormState()
	});

	const selectedCurrency = useWatch({ control, name: "currency" });

	useEffect(() => {
		reset(getDefaultFormState());
	}, [reset, getDefaultFormState]);

	const onSubmit = (formData: DebtFormInput) => {
		onSaved(formData as DebtEntity);
		modalRef.current?.closeModal();
	};

	const handleFormSubmit: React.FormEventHandler = (event) => {
		handleSubmit(onSubmit)(event);
	};

	return (
		<BaseFormModal ref={modalRef} title={t("entity_debt_form_title")} submitHandler={handleFormSubmit}>
			<Stack gap={4}>
				<Field.Root invalid={!!errors.name}>
					<Field.Label>{t("entity_debt_name")}</Field.Label>
					<Input {...register("name")} autoComplete="off" placeholder='Debit card' color="text_primary" backgroundColor="background_primary" borderColor="border_primary" />
					<Field.ErrorText>{errors.name?.message}</Field.ErrorText>
				</Field.Root>
				<Field.Root invalid={!!errors.amount}>
					<Field.Label>{t("entity_debt_amount")}</Field.Label>
					<MoneyInput
						name="amount"
						control={control}
						currency={selectedCurrency?.name ?? ''}
					/>
					<Field.ErrorText>{errors.amount?.message}</Field.ErrorText>
				</Field.Root>
				<Field.Root invalid={!!errors.currency}>
					<Field.Label>{t("entity_debt_currency")}</Field.Label>
					<CollectionSelect name="currency" control={control} placeholder="Select type"
						collection={state.currencies} 
						labelSelector={(currency => currency.name)} 
						valueSelector={(currency => currency.id)} />
					<Field.ErrorText>{errors.currency?.message}</Field.ErrorText>
				</Field.Root>
				<Field.Root invalid={!!errors.date}>
					<Field.Label>{t("entity_debt_date")}</Field.Label>
					<DateSelect name="date" control={control} />
					<Field.ErrorText>{errors.date?.message}</Field.ErrorText>
				</Field.Root>
			</Stack>
		</BaseFormModal>
	);
};

export default DebtModal;