import { Field } from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import MoneyInput from "@/shared/components/MoneyInput/MoneyInput";
import { getSecurities } from "@/api/securities/securityApi";
import { getBrokerAccounts } from "@/api/brokers/brokerAccountApi";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";
import { SecurityEntity } from "@/models/securities/SecurityEntity";
import { SecurityTransactionFormInput, getSecurityTransactionValidationSchema } from "./SecurityTransactionValidationSchema";
import DateSelect from "@/shared/components/DateSelect/DateSelect";
import { SecurityTransactionEntity, SecurityTransactionEntityRequest } from "@/models/securities/SecurityTransactionEntity";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { generateGuid } from "@/shared/utilities/idUtilities";
import { findEntityById } from "@/shared/utilities/arrayUtilities";

import { Nullable } from "@/shared/utilities/nullable";

enum SecurityTransactionOperation {
	Buy = "buy",
	Sell = "sell",
}

export interface CreateSecurityTransactionContext {
	brokerAccountId?: Nullable<string>;
}

export interface EditSecurityTransactionContext {
	securityTransaction: SecurityTransactionEntity
}

interface ModalProps {
	modalRef: RefObject<BaseModalRef | null>
	onSaved: (securityTransaction: SecurityTransactionEntityRequest, securityName?: string) => void
	context: CreateSecurityTransactionContext | EditSecurityTransactionContext
	isGlobalBrokerAccount: boolean
}

interface State {
	securities: SecurityEntity[]
	brokerAccounts: BrokerAccountEntity[]
}

const SecurityTransactionModal: React.FC<ModalProps> = ({
	modalRef,
	onSaved,
	context,
	isGlobalBrokerAccount
}: ModalProps) => {
	const { t } = useTranslation();
	const [state, setState] = useState<State>({ securities: [], brokerAccounts: []});

	const operations = useMemo(() => [
		{ label: t("entity_security_transaction_operation_buy"), value: SecurityTransactionOperation.Buy },
		{ label: t("entity_security_transaction_operation_sell"), value: SecurityTransactionOperation.Sell }
	], [t]);

	const getFormDefaultValues = useCallback(() => {
		if ("securityTransaction" in context) {
			const transaction = context.securityTransaction;
			const operation = transaction.isSell ? operations[1] : operations[0];
			return {
				id: transaction.id,
				security: transaction.security,
				brokerAccount: transaction.brokerAccount,
				brokerCommission: transaction.brokerCommission,
				stockExchangeCommission: transaction.stockExchangeCommission,
				date: transaction.date,
				price: transaction.price,
				tax: transaction.tax,
				quantity: transaction.quantity,
				operation
			};
		}

		return {
			id: generateGuid(),
			security: undefined,
			brokerAccount: { id: context.brokerAccountId ?? undefined },
			brokerCommission: 0,
			stockExchangeCommission: 0,
			date: new Date(),
			price: 0,
			tax: 0,
			quantity: 0,
			operation: operations[0]
		};
	}, [context, operations]);

	const validationSchema = useMemo(() => getSecurityTransactionValidationSchema(t), [t]);

	const { control, handleSubmit, formState: { errors }, reset} = useForm<SecurityTransactionFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: getFormDefaultValues()
	});

	useEffect(() => {
		reset(getFormDefaultValues());
	}, [reset, getFormDefaultValues, context]);

	const selectedSecurity = useWatch({ control, name: "security" });
	const selectedSecurityEntity = findEntityById(state.securities, selectedSecurity?.id);
	const securityCurrency = selectedSecurityEntity?.currency?.name ?? '';

	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			const [securities, brokerAccounts] = await Promise.all([
				getSecurities(),
				getBrokerAccounts()
			]);

			if (isMounted) {
				setState({ securities, brokerAccounts });
			}
		};
		loadData();
		return () => {
			isMounted = false;
		};
	}, []);

	const onSubmit = (securityTransaction: SecurityTransactionFormInput) => {
		const isSell = securityTransaction.operation.value === SecurityTransactionOperation.Sell;

		const transaction: SecurityTransactionEntityRequest = {
			id: securityTransaction.id ?? generateGuid(),
			quantity: securityTransaction.quantity,
			price: securityTransaction.price,
			brokerCommission: securityTransaction.brokerCommission,
			stockExchangeCommission: securityTransaction.stockExchangeCommission,
			tax: securityTransaction.tax,
			isSell,
			date: securityTransaction.date,
			securityId: securityTransaction.security.id,
			brokerAccountId: securityTransaction.brokerAccount.id
		};

		onSaved(transaction, securityTransaction.security.name);
		modalRef.current?.closeModal();
	};

	const handleFormSubmit: React.FormEventHandler = (event) => {
		handleSubmit(onSubmit)(event);
	};

	return (
		<BaseFormModal ref={modalRef} title={t("entity_security_transaction_form_title")} submitHandler={handleFormSubmit}>
			{
				isGlobalBrokerAccount && <Field.Root mt={4} invalid={!!errors.brokerAccount}>
					<Field.Label>{t("entity_security_transaction_broker_account")}</Field.Label>
					<CollectionSelect name="brokerAccount" control={control} placeholder="Select broker account"
						collection={state.brokerAccounts} 
						labelSelector={(brokerAccount => brokerAccount.name)} 
						valueSelector={(brokerAccount => brokerAccount.id)}/>
					<Field.ErrorText>{errors.brokerAccount?.message}</Field.ErrorText>
				</Field.Root>
			}
			<Field.Root mt={4}>
				<Field.Label>{t("entity_security_transaction_operation")}</Field.Label>
				<CollectionSelect name="operation" control={control} placeholder="Select operation"
					collection={operations} 
					labelSelector={(operation => operation.label)} 
					valueSelector={(operation => operation.value)}/>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.security}>
				<Field.Label>{t("entity_security_transaction_security")}</Field.Label>
				<CollectionSelect name="security" control={control} placeholder="Select security"
					collection={state.securities} 
					labelSelector={(security => security.name)} 
					valueSelector={(security => security.id)}/>
				<Field.ErrorText>{errors.security?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.date}>
				<Field.Label>{t("entity_security_transaction_date")}</Field.Label>
				<DateSelect name="date" control={control} isDateTime={true}/>
				<Field.ErrorText>{errors.date?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.price}>
				<Field.Label>{t("entity_security_transaction_price")}</Field.Label>
				<MoneyInput name="price" control={control} currency={securityCurrency} placeholder='100' />
				<Field.ErrorText>{errors.price?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.quantity}>
				<Field.Label>{t("entity_security_transaction_quantity")}</Field.Label>
				<MoneyInput name="quantity" control={control} currency="шт." decimalScale={0} showWordsHelper={false} placeholder='100' />
				<Field.ErrorText>{errors.quantity?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.brokerCommission}>
				<Field.Label>{t("entity_security_transaction_broker_commission")}</Field.Label>
				<MoneyInput name="brokerCommission" control={control} currency={securityCurrency} placeholder='0' />
				<Field.ErrorText>{errors.brokerCommission?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.stockExchangeCommission}>
				<Field.Label>{t("entity_security_transaction_stock_exchange_commission")}</Field.Label>
				<MoneyInput name="stockExchangeCommission" control={control} currency={securityCurrency} placeholder='0' />
				<Field.ErrorText>{errors.stockExchangeCommission?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.tax}>
				<Field.Label>{t("entity_security_transaction_tax")}</Field.Label>
				<MoneyInput name="tax" control={control} currency={securityCurrency} placeholder='0' />
				<Field.ErrorText>{errors.tax?.message}</Field.ErrorText>
			</Field.Root>
		</BaseFormModal>
	);
};

export default SecurityTransactionModal;