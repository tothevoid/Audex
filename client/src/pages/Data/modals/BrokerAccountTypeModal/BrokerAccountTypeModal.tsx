import { Field, Input} from "@chakra-ui/react";
import React, { RefObject, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { BrokerAccountTypeFormInput, getBrokerAccountTypeValidationSchema } from "./BrokerAccountTypeValidationSchema";
import { BrokerAccountTypeEntity } from "@/models/brokers/BrokerAccountTypeEntity";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { generateGuid } from "@/shared/utilities/idUtilities";

interface ModalProps {
	modalRef: RefObject<BaseModalRef | null>;
	brokerAccountType?: BrokerAccountTypeEntity | null;
	onSaved: (accountType: BrokerAccountTypeEntity) => void;
	onModalClosed: () => void;
}

const BrokerAccountTypeModal: React.FC<ModalProps> = ({
	modalRef,
	brokerAccountType,
	onSaved,
	onModalClosed,
}: ModalProps) => {
	const setDefaultValues = useCallback(() => {
		return {
			id: brokerAccountType?.id ?? generateGuid(),
			name: brokerAccountType?.name ?? ""
		};
	}, [brokerAccountType]);

	const { t } = useTranslation();
	const validationSchema = useMemo(() => getBrokerAccountTypeValidationSchema(t), [t]);

	const { register, handleSubmit, formState: { errors }, reset } = useForm<BrokerAccountTypeFormInput>({
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

	const onSubmit = (formData: BrokerAccountTypeFormInput) => {
		onSaved(formData as BrokerAccountTypeEntity);
		modalRef?.current?.closeModal();
	};

	const handleFormSubmit: React.FormEventHandler = (event) => {
		handleSubmit(onSubmit)(event);
	};

	return (
		<BaseFormModal
			visibilityChanged={onModalVisibilityChanged}
			ref={modalRef}
			title={t("entity_broker_account_type_form_title")}
			submitHandler={handleFormSubmit}
		>
			<Field.Root invalid={!!errors.name}>
				<Field.Label>{t("entity_broker_account_type_name")}</Field.Label>
				<Input {...register("name")} autoComplete="off" placeholder={t("entity_broker_account_type_name")} />
				<Field.ErrorText>{errors.name?.message}</Field.ErrorText>
			</Field.Root>
		</BaseFormModal>
	);
};

export default BrokerAccountTypeModal;
