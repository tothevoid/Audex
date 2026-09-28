import { Field, Input} from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { getCryptoProviders } from "@/api/crypto/cryptoProviderApi";
import { CryptoProviderEntity } from "@/models/crypto/CryptoProviderEntity";
import { CryptoAccountFormInput, getCryptoAccountValidationSchema } from "./CryptoAccountValidationSchema";
import { CryptoAccountEntity } from "@/models/crypto/CryptoAccountEntity";
import { generateGuid } from "@/shared/utilities/idUtilities";

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>,
    cryptoAccount?: CryptoAccountEntity | null,
    onSaved: (security: CryptoAccountEntity) => void;
};

interface State {
    cryptoProviders: CryptoProviderEntity[]
}

const CryptoAccountModal: React.FC<ModalProps> = (props: ModalProps) => {
    const [state, setState] = useState<State>({cryptoProviders: []});

    useEffect(() => {
        const initData = async () => {
            await requestData();
        };
        initData();
    }, []);

    const requestData = async () => {
        const cryptoProviders = await getCryptoProviders();

        setState((currentState) => {
            return {...currentState, cryptoProviders };
        });
    };

    const getFormDefaultValues = useCallback(() => {
        return {
            id: props.cryptoAccount?.id ?? generateGuid(),
            name: props.cryptoAccount?.name ?? "",
            cryptoProvider: props.cryptoAccount?.cryptoProvider
        };
    }, [props.cryptoAccount]);

    const { t } = useTranslation();
    const validationSchema = useMemo(() => getCryptoAccountValidationSchema(t), [t]);

    const { register, handleSubmit, control, formState: { errors }, reset} = useForm<CryptoAccountFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: getFormDefaultValues()
    });

    useEffect(() => {
        reset(getFormDefaultValues());
    }, [reset, props.cryptoAccount, getFormDefaultValues]);

    const onSubmit = (cryptoAccount: CryptoAccountFormInput) => {
        props.onSaved(cryptoAccount as CryptoAccountEntity);
        props.modalRef?.current?.closeModal();
    };

    return <BaseFormModal ref={props.modalRef} title={t("entity_crypto_account_form_title")} submitHandler={handleSubmit(onSubmit)}>
        <Field.Root invalid={!!errors.name}>
            <Field.Label>{t("entity_crypto_account_crypto_name")}</Field.Label>
            <Input {...register("name")} autoComplete="off" placeholder='Debit card' />
            <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
        </Field.Root>
        <Field.Root mt={4} invalid={!!errors.cryptoProvider}>
            <Field.Label>{t("entity_crypto_account_crypto_provider")}</Field.Label>
            <CollectionSelect name="cryptoProvider" control={control} placeholder="Select currency"
                collection={state.cryptoProviders} 
                labelSelector={(cryptoProvider => cryptoProvider.name)} 
                valueSelector={(cryptoProvider => cryptoProvider.id)}/>
            <Field.ErrorText>{errors.cryptoProvider?.message}</Field.ErrorText>
        </Field.Root>
    </BaseFormModal>;
};

export default CryptoAccountModal;