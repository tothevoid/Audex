import { Field, Stack } from "@chakra-ui/react";
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import MoneyInput from "@/shared/components/MoneyInput/MoneyInput";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { CryptoAssetEntity } from "@/models/crypto/CryptoAssetEntity";
import { CryptoAssetFormInput, getCryptoAssetValidationSchema } from "./CryptoAssetValidationSchema";
import { getCryptocurrencies } from "@/api/crypto/cryptocurrencyApi";
import { CryptocurrencyEntity } from "@/models/crypto/CryptocurrencyEntity";
import { CryptoAccountEntity } from "@/models/crypto/CryptoAccountEntity";
import { generateGuid } from "@/shared/utilities/idUtilities";
import { findEntityById } from "@/shared/utilities/arrayUtilities";

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>;
    cryptoAsset?: CryptoAssetEntity | null;
    cryptoAccount: CryptoAccountEntity;
    existingCryptocurrencyIds?: string[];
    onSaved: (cryptoAsset: CryptoAssetEntity) => void;
}

interface State {
    cryptocurrencies: CryptocurrencyEntity[];
}

const CryptoAssetModal: React.FC<ModalProps> = ({
    modalRef,
    cryptoAsset,
    cryptoAccount,
    existingCryptocurrencyIds,
    onSaved
}: ModalProps) => {
    const { t } = useTranslation();
   
    const getDefaultValues = useCallback(() => {
        return {
            id: cryptoAsset?.id ?? generateGuid(),
            cryptocurrency: cryptoAsset?.cryptocurrency,
            cryptoAccount: cryptoAsset?.cryptoAccount ?? cryptoAccount,
            quantity: cryptoAsset?.quantity ?? 0
        };
    }, [cryptoAsset, cryptoAccount]);

    const [state, setState] = useState<State>({ cryptocurrencies: [] });
   
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

    const validationSchema = useMemo(() => getCryptoAssetValidationSchema(t), [t]);

    const { handleSubmit, formState: { errors }, reset, control } = useForm<CryptoAssetFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: getDefaultValues()
    });

    useEffect(() => {
        reset(getDefaultValues());
    }, [cryptoAsset, reset, getDefaultValues]);

    const availableCryptocurrencies = useMemo(() => {
        const currentId = cryptoAsset?.cryptocurrency?.id;
        const existingIds = existingCryptocurrencyIds ?? [];
        return state.cryptocurrencies.filter(item => item.id === currentId || !existingIds.includes(item.id));
    }, [state.cryptocurrencies, cryptoAsset, existingCryptocurrencyIds]);

    const selectedCrypto = useWatch({ control, name: "cryptocurrency" });
    const selectedCryptoEntity = findEntityById(state.cryptocurrencies, selectedCrypto?.id);
    const cryptoSymbol = selectedCryptoEntity?.symbol ?? '';

    const onSubmit = (formData: CryptoAssetFormInput) => {
        onSaved(formData as CryptoAssetEntity);
        modalRef.current?.closeModal();
    };

    const handleFormSubmit: React.FormEventHandler = (event) => {
        handleSubmit(onSubmit)(event);
    };

    return (
        <BaseFormModal ref={modalRef} title={t("crypto_asset_modal_title", t("crypto_account_cryptocurrency_modal_title"))} submitHandler={handleFormSubmit}>
            <Stack>
                <Field.Root mt={4} invalid={!!errors.cryptocurrency}>
                    <Field.Label>{t("crypto_asset_cryptocurrency", t("crypto_account_cryptocurrency_cryptocurrency"))}</Field.Label>
                    <CollectionSelect name="cryptocurrency" control={control} placeholder="Select cryptocurrency"
                        collection={availableCryptocurrencies} 
                        labelSelector={(cryptocurrency: CryptocurrencyEntity) => `${cryptocurrency.name} (${cryptocurrency.symbol})`} 
                        valueSelector={(cryptocurrency: CryptocurrencyEntity) => cryptocurrency.id}/>
                    <Field.ErrorText>{errors.cryptocurrency?.message}</Field.ErrorText>
                </Field.Root>
                <Field.Root invalid={!!errors.quantity} mt={4}>
                    <Field.Label>{t("crypto_asset_quantity", t("crypto_account_cryptocurrency_quantity"))}</Field.Label>
                    <MoneyInput name="quantity" control={control} currency={cryptoSymbol} decimalScale={8} showWordsHelper={false} placeholder='1.00' />
                    <Field.ErrorText>{errors.quantity?.message}</Field.ErrorText>
                </Field.Root>
            </Stack>
        </BaseFormModal>
    );
};

export default CryptoAssetModal;
