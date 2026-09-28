import { Field, Input} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { generateGuid } from "@/shared/utilities/idUtilities";
import { BankFormInput, getBankValidationSchema } from "./BankValidationSchema";
import { BankEntity } from "@/models/banks/BankEntity";
import { Nullable } from "@/shared/utilities/nullable";
import { getBankIconUrl } from "@/api/banks/bankApi";
import ImageInput from "@/shared/components/Form/ImageInput/ImageInput";

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>,
    bank?: BankEntity | null,
    onSaved: (account: BankEntity, icon: Nullable<File>) => void;
    onModalClosed: () => void;
};

const BankModal: React.FC<ModalProps> = (props: ModalProps) => {
    const setDefaultValues = useCallback(() => {
        return {
            id: props.bank?.id ?? generateGuid(),
            name: props.bank?.name ?? ""
        };
    }, [props.bank]);

    const { t } = useTranslation();
    const validationSchema = useMemo(() => getBankValidationSchema(t), [t]);

    const { register, handleSubmit, formState: { errors }, reset} = useForm<BankFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: setDefaultValues()
    });

    const onModalVisibilityChanged = (open: boolean) => {
        if (open) {
            reset(setDefaultValues());
        } else {
            setIcon(null);
            setIconUrl(null);
            props.onModalClosed();
        }
    };

    const [icon, setIcon] = useState<File | null>(null);
    const [iconUrl, setIconUrl] = useState<string | null>(null);

    useEffect(() => {
        const url = getBankIconUrl(props.bank?.iconKey);
        setIconUrl(url);
    }, [props.bank]);

    const onSubmit = (bank: BankFormInput) => {
        props.onSaved({...bank, iconKey: props.bank?.iconKey } as BankEntity, icon);
        props.modalRef?.current?.closeModal();
    };

    const onImageSelected = (url: string, image: File) => {
        setIcon(image);
        setIconUrl(url);
    };

    return <BaseFormModal visibilityChanged={onModalVisibilityChanged} ref={props.modalRef} title={t("entity_bank_form_title")} submitHandler={handleSubmit(onSubmit)}>
        <ImageInput imageUrl={iconUrl} onImageSelected={onImageSelected}/>
        <Field.Root invalid={!!errors.name}>
            <Field.Label>{t("entity_bank_name")}</Field.Label>
            <Input {...register("name")} autoComplete="off" placeholder='Sample bank' />
            <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
        </Field.Root>
    </BaseFormModal>;
};

export default BankModal;