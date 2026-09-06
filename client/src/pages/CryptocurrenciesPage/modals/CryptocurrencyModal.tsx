import { Field, Input, Stack, Text } from "@chakra-ui/react"
import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { CryptocurrencyFormInput, getCryptocurrencyValidationSchema } from "./CryptocurrencyValidationSchema";
import BaseFormModal from "../../../shared/modals/BaseFormModal/BaseFormModal";
import { BaseModalRef } from "../../../shared/utilities/modalUtilities";
import { CryptocurrencyEntity } from "../../../models/crypto/CryptocurrencyEntity";
import { getIconUrl } from "../../../api/crypto/cryptocurrencyApi";
import { generateGuid } from "../../../shared/utilities/idUtilities";
import ImageInput from "../../../shared/components/Form/ImageInput/ImageInput";

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>
    cryptocurrency?: CryptocurrencyEntity | null
    onModalClosed: () => void
    onSaved: (cryptocurrency: CryptocurrencyEntity, icon: File | null) => void
};

const CryptocurrencyModal: React.FC<ModalProps> = (props: ModalProps) => {
    const [icon, setIcon] = useState<File | null>(null);
    const [iconUrl, setIconUrl] = useState<string | null>(null);

    const getDefaultValues = useCallback(() => {
        return {
            id: props.cryptocurrency?.id ?? generateGuid(),
            name: props.cryptocurrency?.name ?? "",
            symbol: props.cryptocurrency?.symbol ?? "",
            price: props.cryptocurrency?.price ?? 0
        }
    }, [props.cryptocurrency])

    const { t } = useTranslation();
    const validationSchema = useMemo(() => getCryptocurrencyValidationSchema(t), [t]);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<CryptocurrencyFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: getDefaultValues()
    });

    useEffect(() => {
        if (props.cryptocurrency) {
            reset(props.cryptocurrency);
        }
    }, [props.cryptocurrency, reset]);

    useEffect(() => {
       const url = getIconUrl(props.cryptocurrency?.iconKey);
       setIconUrl(url);
    }, [props.cryptocurrency]);

    const onSubmit = (cryptocurrency: CryptocurrencyFormInput) => {
        props.onSaved({ ...cryptocurrency, iconKey: props.cryptocurrency?.iconKey } as CryptocurrencyEntity, icon);
        props.modalRef?.current?.closeModal();
    }

    const onImageSelected = (url: string, image: File) => {
        setIcon(image);
        setIconUrl(url);
    }

    const onVisibilityChanged = (open: boolean) => {
        if (open) {
            reset(getDefaultValues());
        } else {
            setIcon(null);
            setIconUrl(null);
            props.onModalClosed();
        }
    }

    return <BaseFormModal visibilityChanged={onVisibilityChanged} ref={props.modalRef} title={t("cryptocurrency_form_title")} submitHandler={handleSubmit(onSubmit)}>
        <Stack marginBlock={2} gapX={4} alignItems={"center"} direction={"row"}>
            <ImageInput imageUrl={iconUrl} onImageSelected={onImageSelected} />
            <Field.Root invalid={!!errors.symbol} flex={1}>
                <Field.Label>{t("cryptocurrency_form_symbol")}</Field.Label>
                <Input {...register("symbol")} autoComplete="off" placeholder='BTC' />
                <Field.ErrorText>{errors.symbol?.message}</Field.ErrorText>
            </Field.Root>
        </Stack>
        <Text fontSize="xs" color="text_secondary" mt={1}>
            {t("cryptocurrency_form_symbol_hint")}
        </Text>
        {props.cryptocurrency && (
            <Stack mt={4} p={3} borderRadius="md" bg="background_secondary" gapY={1}>
                <Text fontSize="sm" color="text_secondary">
                    {t("cryptocurrency_form_name")}: <Text as="span" color="text_primary" fontWeight="semibold">{props.cryptocurrency.name}</Text>
                </Text>
                <Text fontSize="sm" color="text_secondary">
                    {t("cryptocurrency_form_price")}: <Text as="span" color="text_primary" fontWeight="semibold">${props.cryptocurrency.price.toLocaleString()}</Text>
                </Text>
            </Stack>
        )}
    </BaseFormModal>
}

export default CryptocurrencyModal;