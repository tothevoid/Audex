import { Field, Input } from "@chakra-ui/react"
import { RefObject, useCallback, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { getBrokers } from "@/api/brokers/brokerApi";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { BrokerAccountTypeEntity } from "@/models/brokers/BrokerAccountTypeEntity";
import { BrokerEntity } from "@/models/brokers/BrokerEntity";
import { getCurrencies } from "@/api/currencies/currencyApi";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import MoneyInput from "@/shared/components/MoneyInput/MoneyInput";
import { BrokerAccountFormInput, getBrokerAccountValidationSchema } from "./BrokerAccountValidationSchema";
import { getBrokerAccountTypes } from "@/api/brokers/brokerAccountTypeApi";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { generateGuid } from "@/shared/utilities/idUtilities";
import { getBanks } from "@/api/banks/bankApi";
import { BankEntity } from "@/models/banks/BankEntity";

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>
    brokerAccount?: BrokerAccountEntity | null,
    onSaved: (account: BrokerAccountEntity) => void;
};

interface State {
    currencies: CurrencyEntity[]
    accountTypes: BrokerAccountTypeEntity[]
    brokers: BrokerEntity[],
    banks: BankEntity[]
}

const BrokerAccountModal: React.FC<ModalProps> = (props: ModalProps) => {
    const [state, setState] = useState<State>({ currencies: [], accountTypes: [], brokers: [], banks: [] })

    useEffect(() => {
        const initData = async () => {
            await requestData();
        }
        initData();
    }, []);

    const requestData = async () => {
        const currencies = await getCurrencies();
        const accountTypes = await getBrokerAccountTypes();
        const brokers = await getBrokers();
        const banks = await getBanks();

        setState((currentState) => {
            return { ...currentState, currencies, accountTypes, brokers, banks }
        })
    };

    const getFormDefaultValues = useCallback(() => {
        return {
            id: props.brokerAccount?.id ?? generateGuid(),
            name: props.brokerAccount?.name ?? "",
            type: props.brokerAccount?.type,
            currency: props.brokerAccount?.currency,
            broker: props.brokerAccount?.broker,
            mainCurrencyAmount: props.brokerAccount?.mainCurrencyAmount ?? 0,
            bank: props.brokerAccount?.bank
        }
    }, [props.brokerAccount]);

    const { t } = useTranslation();
    const validationSchema = useMemo(() => getBrokerAccountValidationSchema(t), [t]);

    const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<BrokerAccountFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: getFormDefaultValues()
    });

    useEffect(() => {
        reset(getFormDefaultValues());
    }, [reset, getFormDefaultValues, props.brokerAccount]);

    const selectedCurrency = watch("currency");
    const currentCurrency = state.currencies.find(c => c.id === selectedCurrency?.id)?.name ?? '';

    const onSubmit = (brokerAccount: BrokerAccountFormInput) => {
        props.onSaved(brokerAccount as BrokerAccountEntity);
        props.modalRef?.current?.closeModal();
    }

    return <BaseFormModal ref={props.modalRef} title={t("entity_broker_account_form_title")} submitHandler={handleSubmit(onSubmit)}>
        <Field.Root mt={4} invalid={!!errors.name}>
            <Field.Label>{t("entity_broker_account_name")}</Field.Label>
            <Input {...register("name")} placeholder="Broker" />
            <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root mt={4} invalid={!!errors.type}>
            <Field.Label>{t("entity_broker_account_type")}</Field.Label>
            <CollectionSelect name="type" control={control} placeholder="Select account type"
                collection={state.accountTypes}
                labelSelector={(accountType => accountType.name)}
                valueSelector={(accountType => accountType.id)} />
            <Field.ErrorText>{errors.type?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root mt={4} invalid={!!errors.currency}>
            <Field.Label>{t("entity_broker_account_currency")}</Field.Label>
            <CollectionSelect name="currency" control={control} placeholder="Select currency"
                collection={state.currencies}
                labelSelector={(currency => currency.name)}
                valueSelector={(currency => currency.id)} />
            <Field.ErrorText>{errors.currency?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root mt={4} invalid={!!errors.bank}>
            <Field.Label>{t("entity_broker_account_bank")}</Field.Label>
            <CollectionSelect name="bank" control={control} placeholder="Select bank"
                collection={state.banks}
                labelSelector={(bank => bank.name)}
                valueSelector={(bank => bank.id)} />
            <Field.ErrorText>{errors.bank?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root mt={4} invalid={!!errors.mainCurrencyAmount}>
            <Field.Label>{t("entity_broker_account_main_currency_amount")}</Field.Label>
            <MoneyInput name="mainCurrencyAmount" control={control} currency={currentCurrency} placeholder='10' />
            <Field.ErrorText>{errors.mainCurrencyAmount?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root mt={4} invalid={!!errors.broker}>
            <Field.Label>{t("entity_broker_account_broker")}</Field.Label>
            <CollectionSelect name="broker" control={control} placeholder="Select broker"
                collection={state.brokers}
                labelSelector={(broker => broker.name)}
                valueSelector={(broker => broker.id)} />
            <Field.ErrorText>{errors.broker?.message}</Field.ErrorText>
        </Field.Root>
    </BaseFormModal>
}
export default BrokerAccountModal