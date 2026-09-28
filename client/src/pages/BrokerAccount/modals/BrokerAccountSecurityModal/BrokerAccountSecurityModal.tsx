import { Field } from "@chakra-ui/react";
import React, { RefObject, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { BrokerAccountSecurityEntity } from "@/models/brokers/BrokerAccountSecurityEntity";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import MoneyInput from "@/shared/components/MoneyInput/MoneyInput";
import { getSecurities } from "@/api/securities/securityApi";
import { getBrokerAccounts } from "@/api/brokers/brokerAccountApi";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";
import { SecurityEntity } from "@/models/securities/SecurityEntity";
import { BrokerAccountSecurityFormInput, getBrokerAccountSecurityValidationSchema } from "./BrokerAccountSecurityValidationSchema";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { generateGuid } from "@/shared/utilities/idUtilities";


interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>,
    brokerAccountSecurity?: BrokerAccountSecurityEntity | null,
    onSaved: (account: BrokerAccountSecurityEntity) => void
};

interface State {
    brokerAccounts: BrokerAccountEntity[]
    securities: SecurityEntity[]
}

const BrokerAccountSecurityModal: React.FC<ModalProps> = (props: ModalProps) => {
    const [state, setState] = useState<State>({ brokerAccounts: [], securities: []});
    
    useEffect(() => {
        const initData = async () => {
            await requestData();
        };
        initData();
    }, []);

    const requestData = async () => {
        const brokerAccounts = await getBrokerAccounts();
        const securities = await getSecurities();
        setState((currentState) => {
            return {...currentState, brokerAccounts, securities};
        });
    };


    const { t } = useTranslation();
    const validationSchema = useMemo(() => getBrokerAccountSecurityValidationSchema(t), [t]);

    const { handleSubmit, control, watch, formState: { errors }} = useForm<BrokerAccountSecurityFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: {
            id: props.brokerAccountSecurity?.id ?? generateGuid(),
            brokerAccount: props.brokerAccountSecurity?.brokerAccount,
            security: props.brokerAccountSecurity?.security,
            price:  props.brokerAccountSecurity?.price ?? 0,
            quantity:  props.brokerAccountSecurity?.quantity ?? 0
        }
    });

    const selectedSecurity = watch("security");
    const securityCurrency = state.securities.find(s => s.id === selectedSecurity?.id)?.currency?.name ?? '';

    const onSubmit = (brokerAccountSecurity: BrokerAccountSecurityFormInput) => {
        props.onSaved(brokerAccountSecurity as BrokerAccountSecurityEntity);
        props.modalRef?.current?.closeModal();
    };

    return <BaseFormModal ref={props.modalRef} title={t("entity_broker_account_security_form_title")} submitHandler={handleSubmit(onSubmit)}>
        <Field.Root mt={4} invalid={!!errors.brokerAccount}>
            <Field.Label>{t("entity_broker_account_broker_account")}</Field.Label>
            <CollectionSelect name="brokerAccount" control={control} placeholder="Select broker account"
                collection={state.brokerAccounts} 
                labelSelector={(brokerAccount => brokerAccount.name)} 
                valueSelector={(brokerAccount => brokerAccount.id)}/>
            <Field.ErrorText>{errors.brokerAccount?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root mt={4} invalid={!!errors.security}>
            <Field.Label>{t("entity_broker_account_security")}</Field.Label>
            <CollectionSelect name="security" control={control} placeholder="Select security"
                collection={state.securities} 
                labelSelector={(security => security.name)} 
                valueSelector={(security => security.id)}/>
            <Field.ErrorText>{errors.security?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root mt={4} invalid={!!errors.price}>
            <Field.Label>{t("entity_broker_initial_price")}</Field.Label>
            <MoneyInput name="price" control={control} currency={securityCurrency} placeholder='500' />
            <Field.ErrorText>{errors.price?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root mt={4} invalid={!!errors.quantity}>
            <Field.Label>{t("entity_broker_quantity")}</Field.Label>
            <MoneyInput name="quantity" control={control} currency="шт." decimalScale={0} showWordsHelper={false} placeholder='500' />
            <Field.ErrorText>{errors.quantity?.message}</Field.ErrorText>
        </Field.Root>
    </BaseFormModal>;
};
export default BrokerAccountSecurityModal;