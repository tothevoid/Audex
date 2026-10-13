import { Field, Stack } from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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

const CryptoAccountCryptocurrencyModal: React.FC<ModalProps> = ({
    modalRef,
    cryptoAccountCryptocurrency,
    cryptoAccount,
    existingCryptocurrencyIds,
    onSaved
}: ModalProps) => {
    const { t } = useTranslation();
   
    const getDefaultValues = useCallback(() => {
        return {
            id: cryptoAccountCryptocurrency?.id ?? generateGuid(),
            cryptocurrency: cryptoAccountCryptocurrency?.cryptocurrency,
            cryptoAccount: cryptoAccountCryptocurrency?.cryptoAccount ?? cryptoAccount,
            quantity: cryptoAccountCryptocurrency?.quantity ?? 0
        };
    }, [cryptoAccountCryptocurrency, cryptoAccount]);

    const [state, setState] = useState<State>({ cryptocurrencies: []});
   
    useEffect(() => {
        let isMounted = true;
        const loadCryptocurrencies = async () => {
            const cryptocurrencies = await getCryptocurrencies();
            if (isMounted) {
                setState((currentState: State) => {
                    return { ...currentState, cryptocurrencies };
                });
            }
        };
        loadCryptocurrencies();
        return () => {
            isMounted = false;
        };
    }, []);

    const validationSchema = useMemo(() => getCryptoAccountCryptocurrencyValidationSchema(t), [t]);

    const { handleSubmit, formState: { errors }, reset, control } = useForm<CryptoAccountCryptocurrencyFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: getDefaultValues()
    });

    useEffect(() => {
        reset(getDefaultValues());
    }, [cryptoAccountCryptocurrency, reset, getDefaultValues]);

    const availableCryptocurrencies = useMemo(() => {
        const currentId = cryptoAccountCryptocurrency?.cryptocurrency?.id;
        const existingIds = existingCryptocurrencyIds ?? [];
        return state.cryptocurrencies.filter(item => item.id === currentId || !existingIds.includes(item.id));
    }, [state.cryptocurrencies, cryptoAccountCryptocurrency, existingCryptocurrencyIds]);

    const selectedCrypto = useWatch({ control, name: "cryptocurrency" });
    const cryptoSymbol = state.cryptocurrencies.find(item => item.id === selectedCrypto?.id)?.symbol ?? '';

    const onSubmit = (formData: CryptoAccountCryptocurrencyFormInput) => {
        onSaved(formData as CryptoAccountCryptocurrencyEntity);
        modalRef.current?.closeModal();
    };

    const handleFormSubmit: React.FormEventHandler = (event) => {
        handleSubmit(onSubmit)(event);
    };

    return (
        <BaseFormModal ref={modalRef} title={t("crypto_account_cryptocurrency_modal_title")} submitHandler={handleFormSubmit}>
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
