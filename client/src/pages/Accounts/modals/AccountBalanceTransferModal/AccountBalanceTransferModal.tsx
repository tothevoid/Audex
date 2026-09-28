import { Field } from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountBalanceTransferFormInput, getAccountBalanceTransferValidationSchema } from "./AccountBalanceTransferModalValidationSchema";
import { useTranslation } from "react-i18next";
import { getAccounts, transferBalance } from "@/api/accounts/accountApi";
import { AccountEntity } from "@/models/accounts/AccountEntity";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import MoneyInput from "@/shared/components/MoneyInput/MoneyInput";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";

interface ModalProps {
	modalRef: RefObject<BaseModalRef | null>,
	from?: AccountEntity | null,
	onTransferred: () => void;
};

type State = {
	accounts: AccountEntity[]
}

export type Transfer = {
	from: AccountEntity,
	to: AccountEntity,
	balance: number
	fee: number
}

const AccountBalanceTransferModal: React.FC<ModalProps> = (props: ModalProps) => {
	const [state, setState] = useState<State>({accounts: []});
	
	useEffect(() => {
		const initData = async () => {
			await initAccounts();
		};
		initData();
	}, []);

	const initAccounts = async () => {
		const accounts = await getAccounts();
		setState((currentState) => {
			return {...currentState, accounts};
		});
	};

	const getFormDefaultValues = useCallback(() => {
		return {
			from: props.from!,
			to: null!,
			balance: 0,
			fee: 0
		};
	}, [props.from]);

	const { t } = useTranslation();
	const validationSchema = useMemo(() => getAccountBalanceTransferValidationSchema(t), [t]);

	const { handleSubmit, control, watch, formState: { errors }, reset } = useForm<AccountBalanceTransferFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: getFormDefaultValues()
	});

	const fromAccount = watch("from");
	const fromCurrency = state.accounts.find(a => a.id === fromAccount?.id)?.currency?.name ?? props.from?.currency?.name ?? '';

	useEffect(() => {
		reset(getFormDefaultValues());
	}, [reset, getFormDefaultValues, props.from]);


	const onSubmit = async (transfer: AccountBalanceTransferFormInput) => {
		const formData = transfer as unknown as Transfer;
		await transferBalance(formData);
		
		props.onTransferred();
		props.modalRef?.current?.closeModal();
	};

	return <BaseFormModal ref={props.modalRef} title={t("account_balance_transfer_modal_title")} submitHandler={handleSubmit(onSubmit)}>
		<Field.Root mt={4} invalid={!!errors.from}>
			<Field.Label>{t("account_balance_transfer_modal_from")}</Field.Label>
			<CollectionSelect name="from" control={control} placeholder="Select sender account"
				collection={state.accounts} 
				labelSelector={(account => account.name)} 
				valueSelector={(account => account.id)}/>
			<Field.ErrorText>{errors.from?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root mt={4} invalid={!!errors.to}>
			<Field.Label>{t("account_balance_transfer_modal_to")}</Field.Label>
			<CollectionSelect name="to" control={control} placeholder="Select recepient account"
				collection={state.accounts} 
				labelSelector={(account => account.name)} 
				valueSelector={(account => account.id)}/>
			<Field.ErrorText>{errors.to?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root invalid={!!errors.balance} mt={4}>
			<Field.Label>{t("account_balance_transfer_modal_balance")}</Field.Label>
			<MoneyInput name="balance" control={control} currency={fromCurrency} placeholder='10000' />
			<Field.ErrorText>{errors.balance?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root invalid={!!errors.fee} mt={4}>
			<Field.Label>{t("account_balance_transfer_modal_fee")}</Field.Label>
			<MoneyInput name="fee" control={control} currency={fromCurrency} placeholder='0' />
			<Field.ErrorText>{errors.fee?.message}</Field.ErrorText>
		</Field.Root>
	</BaseFormModal>;
};

export default AccountBalanceTransferModal;