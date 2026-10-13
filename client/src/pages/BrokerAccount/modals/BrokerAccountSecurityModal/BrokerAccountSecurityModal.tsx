import { Field } from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { findEntityById } from "@/shared/utilities/arrayUtilities";

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>
    brokerAccountSecurity?: BrokerAccountSecurityEntity | null
    onSaved: (account: BrokerAccountSecurityEntity) => void
}

interface State {
    brokerAccounts: BrokerAccountEntity[]
    securities: SecurityEntity[]
}

const BrokerAccountSecurityModal: React.FC<ModalProps> = ({
    modalRef,
    brokerAccountSecurity,
    onSaved
}: ModalProps) => {
    const [state, setState] = useState<State>({ brokerAccounts: [], securities: []});
    
    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            const [brokerAccounts, securities] = await Promise.all([
                getBrokerAccounts(),
                getSecurities()
            ]);
            if (isMounted) {
                setState((currentState) => {
                    return { ...currentState, brokerAccounts, securities };
                });
            }
        };
        loadData();
        return () => {
            isMounted = false;
        };
    }, []);

    const { t } = useTranslation();
    const validationSchema = useMemo(() => getBrokerAccountSecurityValidationSchema(t), [t]);

    const getDefaultValues = useCallback(() => {
        return {
            id: brokerAccountSecurity?.id ?? generateGuid(),
            brokerAccount: brokerAccountSecurity?.brokerAccount,
            security: brokerAccountSecurity?.security,
            price: brokerAccountSecurity?.price ?? 0,
            quantity: brokerAccountSecurity?.quantity ?? 0
        };
    }, [brokerAccountSecurity]);

    const { handleSubmit, control, reset, formState: { errors }} = useForm<BrokerAccountSecurityFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: getDefaultValues()
    });

    useEffect(() => {
        reset(getDefaultValues());
    }, [reset, getDefaultValues, brokerAccountSecurity]);

    const selectedSecurity = useWatch({ control, name: "security" });
    const selectedSecurityEntity = findEntityById(state.securities, selectedSecurity?.id);
    const securityCurrency = selectedSecurityEntity?.currency?.name ?? '';

    const onSubmit = (submittedSecurity: BrokerAccountSecurityFormInput) => {
        onSaved(submittedSecurity as BrokerAccountSecurityEntity);
        modalRef.current?.closeModal();
    };

    const handleFormSubmit: React.FormEventHandler = (event) => {
        handleSubmit(onSubmit)(event);
    };

    return (
        <BaseFormModal ref={modalRef} title={t("entity_broker_account_security_form_title")} submitHandler={handleFormSubmit}>
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
        </BaseFormModal>
    );
};

export default BrokerAccountSecurityModal;