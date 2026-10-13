import { Field, Input} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { BrokerFormInput, getBrokerValidationSchema } from "./BrokerValidationSchema";
import { BrokerEntity } from "@/models/brokers/BrokerEntity";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { RefObject, useCallback, useMemo } from "react";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { generateGuid } from "@/shared/utilities/idUtilities";

interface ModalProps {
    modalRef: RefObject<BaseModalRef | null>;
    broker?: BrokerEntity | null;
    onSaved: (broker: BrokerEntity) => void;
    onModalClosed: () => void;
}

const BrokerModal: React.FC<ModalProps> = ({
    modalRef,
    broker,
    onSaved,
    onModalClosed,
}: ModalProps) => {
    const setDefaultValues = useCallback(() => {
        return {
            id: broker?.id ?? generateGuid(),
            name: broker?.name ?? ""
        };
    }, [broker]);

    const { t } = useTranslation();
    const validationSchema = useMemo(() => getBrokerValidationSchema(t), [t]);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<BrokerFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: setDefaultValues()
    });

    const onModalVisibilityChanged = (open: boolean) => {
        if (open) {
            reset(setDefaultValues());
        } else {
            onModalClosed();
        }
    };

    const onSubmit = (formData: BrokerFormInput) => {
        onSaved(formData as BrokerEntity);
        modalRef?.current?.closeModal();
    };

    const handleFormSubmit: React.FormEventHandler = (event) => {
        handleSubmit(onSubmit)(event);
    };

    return (
        <BaseFormModal
            visibilityChanged={onModalVisibilityChanged}
            ref={modalRef}
            title={t("entity_broker_form_title")}
            submitHandler={handleFormSubmit}
        >
            <Field.Root invalid={!!errors.name}>
                <Field.Label>{t("entity_broker_name")}</Field.Label>
                <Input {...register("name")} autoComplete="off" placeholder={t("entity_broker_name")} />
                <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
            </Field.Root>
        </BaseFormModal>
    );
};

export default BrokerModal;