import { Field, Input } from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import DateSelect from "@/shared/components/DateSelect/DateSelect";
import MoneyInput from "@/shared/components/MoneyInput/MoneyInput";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { DividendPaymentFormInput, getDividendPaymentValidationSchema } from "./DividendPaymentValidationSchema";
import { DividendPaymentEntity } from "@/models/brokers/DividendPaymentEntity";
import { getAvailableDividends } from "@/api/securities/dividendApi";
import { DividendEntity } from "@/models/securities/DividendEntity";
import { formatDate } from "@/shared/utilities/formatters/dateFormatter";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { SecurityEntity } from "@/models/securities/SecurityEntity";
import { generateGuid } from "@/shared/utilities/idUtilities";
import { getBrokerAccounts } from "@/api/brokers/brokerAccountApi";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";

export interface CreateDividendPaymentContext {
	brokerAccountId: string
}

export interface EditDividendPaymentContext {
	dividendPayment: DividendPaymentEntity
}

interface ModalProps {
	isGlobalBrokerAccount: boolean
	modalRef: RefObject<BaseModalRef | null>
	context: CreateDividendPaymentContext | EditDividendPaymentContext
	onSaved: (account: DividendPaymentEntity) => void
}

const DividendPaymentModal: React.FC<ModalProps> = ({
	isGlobalBrokerAccount,
	modalRef,
	context,
	onSaved
}: ModalProps) => {
	const { t, i18n } = useTranslation();

	const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccountEntity[]>([]);
	const [availableSecurities, setAvailableSecurities] = useState<SecurityEntity[]>([]);
	const [availableDividends, setAvailableDividends] = useState<DividendEntity[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const initialSecurity = useMemo(() => {
		return "dividendPayment" in context ? (context.dividendPayment?.dividend?.security ?? null) : null;
	}, [context]);
	const [selectedSecurity, setSelectedSecurity] = useState<SecurityEntity | null>(initialSecurity);

	const [previousContext, setPreviousContext] = useState(context);
	if (context !== previousContext) {
		setPreviousContext(context);
		setSelectedSecurity(initialSecurity);
	}

	const dividendsBySecurity = useMemo(() => {
		if (!selectedSecurity) {
			return [];
		}

		return availableDividends.filter((item) => item.security.id === selectedSecurity.id);
	}, [selectedSecurity, availableDividends]);
	
	const getFormDefaultValues = useCallback(() => {
		const dividendPayment = "dividendPayment" in context ? context.dividendPayment : null;
		const brokerAccount = "brokerAccountId" in context ? { id: context.brokerAccountId } : { id: undefined };

		return {
			id: dividendPayment?.id ?? generateGuid(),
			brokerAccount: dividendPayment?.brokerAccount ?? brokerAccount,
			dividend: dividendPayment?.dividend,
			securitiesQuantity: dividendPayment?.securitiesQuantity ?? 0,
			tax: dividendPayment?.tax ?? 0,
			receivedAt: dividendPayment?.receivedAt ?? new Date(),
		};
	}, [context]);

	const validationSchema = useMemo(() => getDividendPaymentValidationSchema(t), [t]);

	const { reset, handleSubmit, control, formState: { errors } } = useForm<DividendPaymentFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: getFormDefaultValues()
	});

	const brokerAccount = useWatch({ control, name: 'brokerAccount' });
	const securitiesQuantity = useWatch({ control, name: 'securitiesQuantity' });
	const dividend = useWatch({ control, name: 'dividend' });
	const tax = useWatch({ control, name: 'tax' });

	const [previousBrokerAccountId, setPreviousBrokerAccountId] = useState<string | undefined>(brokerAccount?.id);
	if (isGlobalBrokerAccount && brokerAccount?.id !== previousBrokerAccountId) {
		setPreviousBrokerAccountId(brokerAccount?.id);
		setSelectedSecurity(null);
	}

	const payment = (securitiesQuantity && dividend) ? (securitiesQuantity * dividend.amount - tax) : 0;

	const brokerAccountId = useMemo(() => {
		if (isGlobalBrokerAccount) {
			return brokerAccount?.id;
		}

		return "dividendPayment" in context ?
			context.dividendPayment.brokerAccount.id :
			context.brokerAccountId;
	}, [isGlobalBrokerAccount, context, brokerAccount?.id]);

	const fetchAvailableDividends = useCallback(async () => {
		if (!brokerAccountId) {
			return;
		}

		const dividends = await getAvailableDividends(brokerAccountId);
		setAvailableDividends(dividends);

		const securities = new Map<string, SecurityEntity>();
		dividends.forEach((dividendItem) => {
			const securityId = dividendItem.security.id;
			if (securities.has(securityId)) {
				return;
			}

			securities.set(securityId, dividendItem.security);
		});
		
		setAvailableSecurities([...securities.values()]);
	}, [brokerAccountId]);

	const fetchBrokerAccounts = useCallback(async () => {
		if (!isGlobalBrokerAccount) {
			return;
		}

		const accounts = await getBrokerAccounts();
		setBrokerAccounts(accounts);
	}, [isGlobalBrokerAccount]);

	useEffect(() => {
		let isMounted = true;

		const loadData = async () => {
			try {
				await Promise.all([
					fetchBrokerAccounts(),
					fetchAvailableDividends()
				]);
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		loadData();

		return () => {
			isMounted = false;
		};
	}, [fetchBrokerAccounts, fetchAvailableDividends]);

	useEffect(() => {
		reset(getFormDefaultValues());
	}, [reset, getFormDefaultValues, context]);

	const onSubmit = (dividendPayment: DividendPaymentFormInput) => {
		onSaved(dividendPayment as DividendPaymentEntity);
		modalRef.current?.closeModal();
	};

	const handleFormSubmit: React.FormEventHandler = (event) => {
		handleSubmit(onSubmit)(event);
	};

	return (
		<BaseFormModal ref={modalRef} title={t("entity_dividend_payment_form_title")} 
			submitHandler={handleFormSubmit}>
			{
				isGlobalBrokerAccount &&
				<Field.Root mt={4}>
					<Field.Label>{t("entity_dividend_payment_broker_account")}</Field.Label>
					<CollectionSelect name="brokerAccount" control={control} placeholder="Select broker account"
						collection={brokerAccounts} 
						labelSelector={account => account.name}
						valueSelector={account => account.id}
						isDisabled={isLoading} />
					<Field.ErrorText>{errors.brokerAccount?.message}</Field.ErrorText>
				</Field.Root>
			}
			<Field.Root mt={4}>
				<Field.Label>{t("dividend_payment_form_security")}</Field.Label>
				<Select value={selectedSecurity} onChange={setSelectedSecurity} 
					getOptionLabel={(security: SecurityEntity) => `${security.name} (${security.ticker})`}
					getOptionValue={(security: SecurityEntity) => security.id}
					options={availableSecurities}
					isDisabled={isLoading || availableSecurities.length === 0}/>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.dividend}>
				<Field.Label>{t("entity_dividend_payment_dividend")}</Field.Label>
				<CollectionSelect name="dividend" control={control} placeholder="Select security"
					collection={dividendsBySecurity} 
					labelSelector={(dividendItem: DividendEntity) => 
						`${formatDate(dividendItem.snapshotDate, i18n)} (${formatMoneyByCurrencyCulture(dividendItem.amount, dividendItem.security.currency.name)})`} 
					valueSelector={(dividendItem => dividendItem.id)}
					isDisabled={isLoading || !selectedSecurity || dividendsBySecurity.length === 0}/>
				<Field.ErrorText>{errors.dividend?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.securitiesQuantity}>
				<Field.Label>{t("entity_dividend_payment_securities_quantity")}</Field.Label>
				<MoneyInput name="securitiesQuantity" control={control} currency="шт." decimalScale={0} showWordsHelper={false} placeholder='100' />
				<Field.ErrorText>{errors.securitiesQuantity?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.tax}>
				<Field.Label>{t("entity_dividend_payment_tax")}</Field.Label>
				<MoneyInput name="tax" control={control} currency={selectedSecurity?.currency.name ?? ''} placeholder='0' />
				<Field.ErrorText>{errors.tax?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.receivedAt}>
				<Field.Label>{t("entity_dividend_received_at")}</Field.Label>
				<DateSelect name="receivedAt" control={control}/>
				<Field.ErrorText>{errors.receivedAt?.message}</Field.ErrorText>
			</Field.Root>
			{
				payment > 0 && <Field.Root mt={4}>
					<Field.Label>{t("dividend_payment_form_payment")}</Field.Label>
					<Input disabled value={selectedSecurity ? formatMoneyByCurrencyCulture(payment, selectedSecurity?.currency.name): ""}/>
				</Field.Root>
			}
		</BaseFormModal>
	);
};

export default DividendPaymentModal;