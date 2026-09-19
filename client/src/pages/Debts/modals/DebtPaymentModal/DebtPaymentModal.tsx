import { Field, Stack } from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import CollectionSelect from "../../../../shared/components/CollectionSelect/CollectionSelect";
import { DebtEntity } from "../../../../models/debts/DebtEntity";
import DateSelect from "../../../../shared/components/DateSelect/DateSelect";
import { DebtPaymentFormInput, getDebtPaymentValidationSchema } from "./DebtPaymentValidationSchema";
import { DebtPaymentEntity } from "../../../../models/debts/DebtPaymentEntity";
import { AccountEntity } from "../../../../models/accounts/AccountEntity";
import { getDebts } from "../../../../api/debts/debtApi";
import { getAccounts } from "../../../../api/accounts/accountApi";
import BaseFormModal from "../../../../shared/modals/BaseFormModal/BaseFormModal";
import { BaseModalRef } from "../../../../shared/utilities/modalUtilities";
import { generateGuid } from "../../../../shared/utilities/idUtilities";
import CheckboxInput from "../../../../shared/components/CheckboxInput/CheckboxInput";
import MoneyInput from "../../../../shared/components/MoneyInput/MoneyInput";

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

const DebtPaymentModal: React.FC<Props> = (props: Props) => {
	const [state, setState] = useState<State>({ accounts: [], debts: [] });

	useEffect(() => {
		const initData = async () => {
			await requestData();
		};
		initData();
	}, []);

	const requestData = async () => {
		const [debts, accounts] = await Promise.all([
			getDebts(true),
			getAccounts({ onlyActive: false })
		]);

		setState((currentState) => {
			return { ...currentState, debts, accounts };
		});
	};

	const availableDebts = useMemo(() => {
		if (props.debtPayment?.debt && !state.debts.some((d) => d.id === props.debtPayment?.debt?.id)) {
			return [props.debtPayment.debt, ...state.debts];
		}
		return state.debts;
	}, [props.debtPayment, state.debts]);

	const getDefaultFormState = useCallback(() => {
		const initialDebt = props.debtPayment?.debt
			? (availableDebts.find((d) => d.id === props.debtPayment?.debt?.id) || props.debtPayment.debt)
			: props.selectedDebtId
				? (availableDebts.find((d) => d.id === props.selectedDebtId) || undefined)
				: undefined;
		const initialAccount = props.debtPayment?.targetAccount
			? (state.accounts.find((a) => a.id === props.debtPayment?.targetAccount?.id) || props.debtPayment.targetAccount)
			: undefined;

		return {
			id: props.debtPayment?.id ?? generateGuid(),
			amount: props.debtPayment?.amount ?? 0,
			date: props.debtPayment?.date ?? new Date(),
			debt: initialDebt,
			targetAccount: initialAccount,
			isPercentagePayment: props.debtPayment?.isPercentagePayment ?? false
		};
	}, [props.debtPayment, props.selectedDebtId, availableDebts, state.accounts]);

	const { t } = useTranslation();
	const validationSchema = useMemo(() => getDebtPaymentValidationSchema(t), [t]);

	const { handleSubmit, control, formState: { errors }, reset, setValue } = useForm<DebtPaymentFormInput>({
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
		return availableDebts.find((d) => d.id === selectedDebtFormValue.id) || null;
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
			const selectedAccountEntity = state.accounts.find((a) => a.id === selectedAccountFormValue.id);
			if (selectedAccountEntity && selectedAccountEntity.currency?.id !== selectedDebtEntity.currency.id) {
				setValue("targetAccount", undefined as any);
			}
		}
	}, [selectedDebtEntity, selectedAccountFormValue, state.accounts, setValue]);

	const onModalVisibilityChanged = async (open: boolean) => {
		if (open) {
			await requestData();
		}
	};

	const onSubmit = (debt: DebtPaymentFormInput) => {
		props.onSaved(debt as DebtPaymentEntity);
		props.modalRef?.current?.closeModal();
	};

	return (
		<BaseFormModal
			ref={props.modalRef}
			title={t("entity_debt_payment_form_title")}
			submitHandler={handleSubmit(onSubmit)}
			visibilityChanged={onModalVisibilityChanged}
		>
			<Stack gap={4}>
				<Field.Root invalid={!!errors.debt}>
					<Field.Label>{t("entity_debt_payment_debt")}</Field.Label>
					<CollectionSelect name="debt" control={control} placeholder="Select debt"
						collection={availableDebts}
						labelSelector={(debt => debt.name)}
						valueSelector={(debt => debt.id)}
						isDisabled={Boolean(props.selectedDebtId)} />
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