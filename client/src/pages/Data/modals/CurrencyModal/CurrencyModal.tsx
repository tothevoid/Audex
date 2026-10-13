import { Field, Input } from "@chakra-ui/react";
import React, { RefObject, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getCurrencyModalValidationSchema, CurrencyFormInput } from "./CurrencyValidationSchema";
import { useTranslation } from "react-i18next";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import CheckboxInput from "@/shared/components/CheckboxInput/CheckboxInput";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { generateGuid } from "@/shared/utilities/idUtilities";

interface ModalProps {
	modalRef: RefObject<BaseModalRef | null>;
	currency?: CurrencyEntity | null;
	onSaved: (account: CurrencyEntity) => void;
}

const CurrencyModal: React.FC<ModalProps> = ({
	modalRef,
	currency,
	onSaved,
}: ModalProps) => {
	const { t } = useTranslation();
	const validationSchema = useMemo(() => getCurrencyModalValidationSchema(t), [t]);

	const getDefaultValues = useCallback(() => ({
		id: currency?.id ?? generateGuid(),
		name: currency?.name ?? "",
		active: currency?.active ?? true,
	}), [currency]);

	const { register, handleSubmit, control, formState: { errors } } = useForm<CurrencyFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: getDefaultValues(),
	});

	const onSubmit = (formData: CurrencyFormInput) => {
		onSaved(formData as CurrencyEntity);
		modalRef?.current?.closeModal();
	};

	const handleFormSubmit: React.FormEventHandler = (event) => {
		handleSubmit(onSubmit)(event);
	};

	return (
		<BaseFormModal ref={modalRef} title={t("entity_currency_name_form_title")} submitHandler={handleFormSubmit}>
			<Field.Root invalid={!!errors.name}>
				<Field.Label>{t("entity_currency_name")}</Field.Label>
				<Input {...register("name")} autoComplete="off" placeholder='USD' />
				<Field.ErrorText>{errors.name?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root invalid={!!errors.active} mt={4}>
				<CheckboxInput name="active" control={control} title={t("entity_currency_active")} />
				<Field.ErrorText>{errors.active?.message}</Field.ErrorText>
			</Field.Root>
		</BaseFormModal>
	);
};

export default CurrencyModal;