import { Field, Input} from "@chakra-ui/react";
import React, { RefObject, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { CryptoProviderEntity } from "@/models/crypto/CryptoProviderEntity";
import { CryptoProviderFormInput, getCryptoProviderValidationSchema } from "./CryptoProviderValidationSchema";
import { generateGuid } from "@/shared/utilities/idUtilities";
import { Nullable } from "@/shared/utilities/nullable";
import { getCryptoProviderIconUrl } from "@/api/crypto/cryptoProviderApi";
import ImageInput from "@/shared/components/Form/ImageInput/ImageInput";

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>;
    cryptoProvider?: CryptoProviderEntity | null;
    onSaved: (cryptoProvider: CryptoProviderEntity, icon: Nullable<File>) => void;
    onModalClosed: () => void;
}

const CryptoProviderModal: React.FC<ModalProps> = ({
    modalRef,
    cryptoProvider,
    onSaved,
    onModalClosed,
}: ModalProps) => {
    const setDefaultValues = useCallback(() => {
        return {
            id: cryptoProvider?.id ?? generateGuid(),
            name: cryptoProvider?.name ?? ""
        };
    }, [cryptoProvider]);

    const { t } = useTranslation();
    const validationSchema = useMemo(() => getCryptoProviderValidationSchema(t), [t]);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<CryptoProviderFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: setDefaultValues()
    });

    const [icon, setIcon] = useState<File | null>(null);
    const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);

    const iconUrl = customIconUrl ?? (cryptoProvider?.iconKey ? getCryptoProviderIconUrl(cryptoProvider.iconKey) : null);

    const onModalVisibilityChanged = (open: boolean) => {
        if (open) {
            reset(setDefaultValues());
        } else {
            setIcon(null);
            setCustomIconUrl(null);
            onModalClosed();
        }
    };

    const onSubmit = (formData: CryptoProviderFormInput) => {
        onSaved({ ...formData, iconKey: cryptoProvider?.iconKey } as CryptoProviderEntity, icon);
        modalRef?.current?.closeModal();
    };

    const handleFormSubmit: React.FormEventHandler = (event) => {
        handleSubmit(onSubmit)(event);
    };

    const onImageSelected = (url: string, image: File) => {
        setIcon(image);
        setCustomIconUrl(url);
    };

    return (
        <BaseFormModal
            visibilityChanged={onModalVisibilityChanged}
            ref={modalRef}
            title={t("entity_crypto_provider_form_title")}
            submitHandler={handleFormSubmit}
        >
            <ImageInput imageUrl={iconUrl} onImageSelected={onImageSelected} />
            <Field.Root invalid={!!errors.name}>
                <Field.Label>{t("entity_crypto_provider_name")}</Field.Label>
                <Input {...register("name")} autoComplete="off" placeholder={t("entity_crypto_provider_name")} />
                <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
            </Field.Root>
        </BaseFormModal>
    );
};

export default CryptoProviderModal;
