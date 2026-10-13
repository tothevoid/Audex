import { Field, Stack } from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import { DebtEntity } from "@/models/debts/DebtEntity";
import DateSelect from "@/shared/components/DateSelect/DateSelect";
import { DebtPaymentFormInput, getDebtPaymentValidationSchema } from "./DebtPaymentValidationSchema";
import { DebtPaymentEntity } from "@/models/debts/DebtPaymentEntity";
import { AccountEntity } from "@/models/accounts/AccountEntity";
import { getDebts } from "@/api/debts/debtApi";
import { getAccounts } from "@/api/accounts/accountApi";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { generateGuid } from "@/shared/utilities/idUtilities";
import { findEntityById } from "@/shared/utilities/arrayUtilities";
import CheckboxInput from "@/shared/components/CheckboxInput/CheckboxInput";
import MoneyInput from "@/shared/components/MoneyInput/MoneyInput";

interface Props {
	debtPayment?: DebtPaymentEntity | null,
	selectedDebtId?: string | null,
	onSaved: (debt: DebtPaymentEntity) => void;
	modalRef: RefObject<BaseModalRef | null>
};

interface State {
	accounts: AccountEntity[],
	debts: DebtEntity[]
}

const DebtPaymentModal: React.FC<Props> = ({
	debtPayment,
	selectedDebtId,
	onSaved,
	modalRef,
}: Props) => {
	const [state, setState] = useState<State>({ accounts: [], debts: [] });

	useEffect(() => {
		let isMounted = true;
		const initData = async () => {
			const [debts, accounts] = await Promise.all([
				getDebts(true),
				getAccounts({ onlyActive: false })
			]);
			if (isMounted) {
				setState((currentState) => ({ ...currentState, debts, accounts }));
			}
		};
		initData();
		return () => {
			isMounted = false;
		};
	}, []);

	const availableDebts = useMemo(() => {
		if (debtPayment?.debt && !state.debts.some((debt) => debt.id === debtPayment.debt?.id)) {
			return [debtPayment.debt, ...state.debts];
		}
		return state.debts;
	}, [debtPayment, state.debts]);

	const getDefaultFormState = useCallback(() => {
		const initialDebt = findEntityById(
			availableDebts,
			debtPayment?.debt?.id ?? selectedDebtId,
			debtPayment?.debt
		);
		const initialAccount = findEntityById(
			state.accounts,
			debtPayment?.targetAccount?.id,
			debtPayment?.targetAccount
		);

		return {
			id: debtPayment?.id ?? generateGuid(),
			amount: debtPayment?.amount ?? 0,
			date: debtPayment?.date ?? new Date(),
			debt: initialDebt,
			targetAccount: initialAccount,
			isPercentagePayment: debtPayment?.isPercentagePayment ?? false
		};
	}, [debtPayment, selectedDebtId, availableDebts, state.accounts]);

	const { t } = useTranslation();
	const validationSchema = useMemo(() => getDebtPaymentValidationSchema(t), [t]);

	const { handleSubmit, control, formState: { errors }, reset, resetField } = useForm<DebtPaymentFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: getDefaultFormState()
	});

	useEffect(() => {
		reset(getDefaultFormState());
	}, [reset, getDefaultFormState]);

	const selectedDebtFormValue = useWatch({ control, name: "debt" });
	const selectedAccountFormValue = useWatch({ control, name: "targetAccount" });

	const selectedDebtEntity = useMemo(() => {
		if (!selectedDebtFormValue?.id) return null;
		return findEntityById(availableDebts, selectedDebtFormValue.id) ?? null;
	}, [selectedDebtFormValue, availableDebts]);

	const availableAccounts = useMemo(() => {
		if (!selectedDebtEntity || !selectedDebtEntity.currency) {
			return state.accounts;
		}
		return state.accounts.filter(
			(account) => account.currency?.id === selectedDebtEntity.currency.id
		);
	}, [selectedDebtEntity, state.accounts]);

	useEffect(() => {
		if (selectedDebtEntity && selectedDebtEntity.currency && selectedAccountFormValue?.id) {
			const selectedAccountEntity = findEntityById(state.accounts, selectedAccountFormValue.id);
			if (selectedAccountEntity && selectedAccountEntity.currency?.id !== selectedDebtEntity.currency.id) {
				resetField("targetAccount");
			}
		}
	}, [selectedDebtEntity, selectedAccountFormValue, state.accounts, resetField]);

	const onSubmit = (formData: DebtPaymentFormInput) => {
		onSaved(formData as DebtPaymentEntity);
		modalRef?.current?.closeModal();
	};

	const handleFormSubmit: React.FormEventHandler = (event) => {
		handleSubmit(onSubmit)(event);
	};

	return (
		<BaseFormModal
			ref={modalRef}
			title={t("entity_debt_payment_form_title")}
			submitHandler={handleFormSubmit}
		>
			<Stack gap={4}>
				<Field.Root invalid={!!errors.debt}>
					<Field.Label>{t("entity_debt_payment_debt")}</Field.Label>
					<CollectionSelect name="debt" control={control} placeholder="Select debt"
						collection={availableDebts}
						labelSelector={(debt => debt.name)}
						valueSelector={(debt => debt.id)}
						isDisabled={Boolean(selectedDebtId)} />
					<Field.ErrorText>{errors.debt?.message}</Field.ErrorText>
				</Field.Root>
				<Field.Root invalid={!!errors.amount}>
					<Field.Label>{t("entity_debt_payment_amount")}</Field.Label>
					<MoneyInput
						name="amount"
						control={control}
						currency={selectedDebtEntity?.currency?.name ?? ''}
					/>
					<Field.ErrorText>{errors.amount?.message}</Field.ErrorText>
				</Field.Root>
				<Field.Root invalid={!!errors.targetAccount}>
					<Field.Label>{t("entity_debt_payment_target_account")}</Field.Label>
					<CollectionSelect name="targetAccount" control={control} placeholder="Select account"
						collection={availableAccounts}
						labelSelector={(account => account.name)}
						valueSelector={(account => account.id)} />
					<Field.ErrorText>{errors.targetAccount?.message}</Field.ErrorText>
				</Field.Root>
				<Field.Root invalid={!!errors.date}>
					<Field.Label>{t("entity_debt_payment_date")}</Field.Label>
					<DateSelect name="date" control={control} />
					<Field.ErrorText>{errors.date?.message}</Field.ErrorText>
				</Field.Root>
				<Field.Root invalid={!!errors.isPercentagePayment}>
					<CheckboxInput name="isPercentagePayment" control={control} title={t("entity_debt_payment_is_percentage_payment")} />
					<Field.ErrorText>{errors.isPercentagePayment?.message}</Field.ErrorText>
				</Field.Root>
			</Stack>
		</BaseFormModal>
	);
};

export default DebtPaymentModal;