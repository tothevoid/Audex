import { Field, Input} from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountFormInput, getAccountValidationSchema } from "./AccountValidationSchema";
import { useTranslation } from "react-i18next";
import { getAccountTypes } from "@/api/accounts/accountTypeApi";
import { getCurrencies } from "@/api/currencies/currencyApi";
import { AccountEntity } from "@/models/accounts/AccountEntity";
import { AccountTypeEntity } from "@/models/accounts/AccountTypeEntity";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import CheckboxInput from "@/shared/components/CheckboxInput/CheckboxInput";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import DateSelect from "@/shared/components/DateSelect/DateSelect";
import MoneyInput from "@/shared/components/MoneyInput/MoneyInput";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { generateGuid } from "@/shared/utilities/idUtilities";
import { getBanks } from "@/api/banks/bankApi";
import { BankEntity } from "@/models/banks/BankEntity";
import { ACCOUNT_TYPE } from "@/shared/constants/accountType";


interface ModalProps {
	modalRef: RefObject<BaseModalRef | null>,
	account?: AccountEntity | null,
	onSaved: (account: AccountEntity) => void;
};

interface State {
	currencies: CurrencyEntity[]
	accountTypes: AccountTypeEntity[],
	banks: BankEntity[]
}

const AccountModal: React.FC<ModalProps> = ({
	modalRef,
	account,
	onSaved
}: ModalProps) => {
  	const [state, setState] = useState<State>({currencies: [], accountTypes: [], banks: []});

	useEffect(() => {
		let isMounted = true;
		const initData = async () => {
			const [currencies, accountTypes, banks] = await Promise.all([
				getCurrencies(),
				getAccountTypes(),
				getBanks()
			]);
			if (isMounted) {
				setState({ currencies, accountTypes, banks });
			}
		};
		initData();
		return () => {
			isMounted = false;
		};
	}, []);

	const getFormDefaultValues = useCallback(() => {
		return {
			id: account?.id ?? generateGuid(),
			name: account?.name ?? "",
			balance: account?.balance ?? 0,
			currency: account?.currency,
			accountType: account?.accountType,
			active: account?.active ?? true,
			createdOn: account?.createdOn ?? new Date(),
			bank: account?.bank
		};
	}, [account]);

	const { t } = useTranslation();
	const validationSchema = useMemo(() => getAccountValidationSchema(t), [t]);

	const { register, handleSubmit, control, formState: { errors }, reset } = useForm<AccountFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: getFormDefaultValues()
	});

	const accountType = useWatch({ control, name: "accountType" });
	const selectedCurrency = useWatch({ control, name: "currency" });
	const currentCurrency = selectedCurrency?.name ?? '';
	const bankFieldVisible = accountType?.id === ACCOUNT_TYPE.DEBIT_CARD || 
		accountType?.id === ACCOUNT_TYPE.CREDIT_CARD;

	useEffect(() => {
		reset(getFormDefaultValues());
	}, [reset, getFormDefaultValues, account]);

	const onSubmit = async (savedAccount: AccountFormInput) => {
		const accountEntity = savedAccount as AccountEntity;

		if (savedAccount.bank?.id) {
			accountEntity.bank = state.banks.find(bank => bank.id === savedAccount.bank?.id);
		}

		await onSaved(accountEntity);
		modalRef?.current?.closeModal();
	};

	const handleFormSubmit: React.FormEventHandler = (event) => {
		handleSubmit(onSubmit)(event);
	};

	return <BaseFormModal ref={modalRef} title={t("entity_account_name_form_title")} submitHandler={handleFormSubmit}>
		<Field.Root invalid={!!errors.name}>
			<Field.Label>{t("entity_account_name")}</Field.Label>
			<Input {...register("name")} autoComplete="off" placeholder='Debit card' />
			<Field.ErrorText>{errors.name?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root mt={4} invalid={!!errors.accountType}>
			<Field.Label>{t("entity_transaction_type")}</Field.Label>
			<CollectionSelect name="accountType" control={control} placeholder="Select account type"
				collection={state.accountTypes} 
				labelSelector={(accountType => accountType.name)} 
				valueSelector={(accountType => accountType.id)}/>
			<Field.ErrorText>{errors.accountType?.message}</Field.ErrorText>
		</Field.Root>
		{
			bankFieldVisible && <Field.Root mt={4} invalid={!!errors.bank}>
				<Field.Label>{t("entity_transaction_bank")}</Field.Label>
				<CollectionSelect name="bank" control={control} placeholder="Select bank"
					collection={state.banks} 
					labelSelector={(bank => bank.name)} 
					valueSelector={(bank => bank.id)}/>
				<Field.ErrorText>{errors.bank?.message}</Field.ErrorText>
			</Field.Root>
		}
		<Field.Root mt={4} invalid={!!errors.currency}>
			<Field.Label>{t("entity_transaction_currency")}</Field.Label>
			<CollectionSelect name="currency" control={control} placeholder="Select currency"
				collection={state.currencies} 
				labelSelector={(currency => currency.name)} 
				valueSelector={(currency => currency.id)}/>
			<Field.ErrorText>{errors.currency?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root invalid={!!errors.balance} mt={4}>
			<Field.Label>{t("entity_account_balance")}</Field.Label>
			<MoneyInput name="balance" control={control} currency={currentCurrency} placeholder='1000' />
			<Field.ErrorText>{errors.balance?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root invalid={!!errors.createdOn} mt={4}>
			<Field.Label>{t("entity_account_created_on")}</Field.Label>
			<DateSelect name="createdOn" control={control}/>
			<Field.ErrorText>{errors.createdOn?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root invalid={!!errors.active} mt={4}>
			<CheckboxInput name="active" control={control} title={t("entity_account_active")}/>
			<Field.ErrorText>{errors.active?.message}</Field.ErrorText>
		</Field.Root>
	</BaseFormModal>;
};

export default AccountModal;