import { Field, Stack } from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import MoneyInput from "@/shared/components/MoneyInput/MoneyInput";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { CryptoAccountCryptocurrencyEntity } from "@/models/crypto/CryptoAccountCryptocurrencyEntity";
import { CryptoAccountCryptocurrencyFormInput, getCryptoAccountCryptocurrencyValidationSchema } from "./CryptoAccountCryptocurrencyValidationSchema";
import { getCryptocurrencies } from "@/api/crypto/cryptocurrencyApi";
import { CryptocurrencyEntity } from "@/models/crypto/CryptocurrencyEntity";
import { CryptoAccountEntity } from "@/models/crypto/CryptoAccountEntity";
import { generateGuid } from "@/shared/utilities/idUtilities";

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>;
    cryptoAccountCryptocurrency?: CryptoAccountCryptocurrencyEntity | null;
    cryptoAccount: CryptoAccountEntity;
    existingCryptocurrencyIds?: string[];
    onSaved: (cryptoAccountCryptocurrency: CryptoAccountCryptocurrencyEntity) => void;
}

interface State {
    cryptocurrencies: CryptocurrencyEntity[]
}

const CryptoAccountCryptocurrencyModal: React.FC<ModalProps> = (props: ModalProps) => {
    const { t } = useTranslation();
   
    const getDefaultValues = useCallback(() => {
        return {
            id: props.cryptoAccountCryptocurrency?.id ?? generateGuid(),
            cryptocurrency: props.cryptoAccountCryptocurrency?.cryptocurrency,
            cryptoAccount: props.cryptoAccountCryptocurrency?.cryptoAccount ?? props.cryptoAccount,
            quantity: props.cryptoAccountCryptocurrency?.quantity ?? 0
        };
    }, [props.cryptoAccountCryptocurrency, props.cryptoAccount]);

    const [state, setState] = useState<State>({ cryptocurrencies: []});
   
    const initCryptocurrencies = async () => {
        const cryptocurrencies = await getCryptocurrencies();
        setState((currentState: State) => {
            return {...currentState, cryptocurrencies};
        });
    };

    useEffect(() => {
        initCryptocurrencies();
    }, []);

    const validationSchema = useMemo(() => getCryptoAccountCryptocurrencyValidationSchema(t), [t]);

    const { handleSubmit, formState: { errors }, reset, control, watch } = useForm<CryptoAccountCryptocurrencyFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: getDefaultValues()
    });

    useEffect(() => {
        reset(getDefaultValues());
    }, [props.cryptoAccountCryptocurrency, reset, getDefaultValues]);

    const availableCryptocurrencies = useMemo(() => {
        const currentId = props.cryptoAccountCryptocurrency?.cryptocurrency?.id;
        const existingIds = props.existingCryptocurrencyIds ?? [];
        return state.cryptocurrencies.filter(c => c.id === currentId || !existingIds.includes(c.id));
    }, [state.cryptocurrencies, props.cryptoAccountCryptocurrency, props.existingCryptocurrencyIds]);

    const selectedCrypto = watch("cryptocurrency");
    const cryptoSymbol = state.cryptocurrencies.find(c => c.id === selectedCrypto?.id)?.symbol ?? '';

    const onSubmit = (data: CryptoAccountCryptocurrencyFormInput) => {
        props.onSaved(data as CryptoAccountCryptocurrencyEntity);
        props.modalRef?.current?.closeModal();
    };

    return (
        <BaseFormModal ref={props.modalRef} title={t("crypto_account_cryptocurrency_modal_title")} submitHandler={handleSubmit(onSubmit)}>
            <Stack>
                <Field.Root mt={4} invalid={!!errors.cryptocurrency}>
                    <Field.Label>{t("crypto_account_cryptocurrency_cryptocurrency")}</Field.Label>
                    <CollectionSelect name="cryptocurrency" control={control} placeholder="Select cryptocurrency"
                        collection={availableCryptocurrencies} 
                        labelSelector={(cryptocurrency: CryptocurrencyEntity) => `${cryptocurrency.name} (${cryptocurrency.symbol})`} 
                        valueSelector={(cryptocurrency: CryptocurrencyEntity) => cryptocurrency.id}/>
                    <Field.ErrorText>{errors.cryptocurrency?.message}</Field.ErrorText>
                </Field.Root>
                <Field.Root invalid={!!errors.quantity} mt={4}>
                    <Field.Label>{t("crypto_account_cryptocurrency_quantity")}</Field.Label>
                    <MoneyInput name="quantity" control={control} currency={cryptoSymbol} decimalScale={8} showWordsHelper={false} placeholder='1.00' />
                    <Field.ErrorText>{errors.quantity?.message}</Field.ErrorText>
                </Field.Root>
            </Stack>
        </BaseFormModal>
    );
};

export default CryptoAccountCryptocurrencyModal;
