import { Field, Input } from "@chakra-ui/react";
import React, { RefObject, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { getTransactionTypeValidationSchema, TransactionTypeFormInput } from "./TransactionTypeValidationSchema";
import { getTransactionTypeIconUrl } from "@/api/transactions/transactionTypeApi";
import { TransactionTypeEntity } from "@/models/transactions/TransactionTypeEntity";
import CheckboxInput from "@/shared/components/CheckboxInput/CheckboxInput";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { generateGuid } from "@/shared/utilities/idUtilities";
import ImageInput from "@/shared/components/Form/ImageInput/ImageInput";

interface ModalProps {
	modalRef: RefObject<BaseModalRef | null>,
	transactionType?: TransactionTypeEntity | null,
	onSaved: (account: TransactionTypeEntity, icon: File | null) => void,
	onModalClosed: () => void;
};

const TransactionTypeModal: React.FC<ModalProps> = ({
	modalRef,
	transactionType,
	onSaved,
	onModalClosed,
}: ModalProps) => {
	const { t } = useTranslation();
	const validationSchema = useMemo(() => getTransactionTypeValidationSchema(t), [t]);

	const { register, reset, handleSubmit, control, formState: { errors } } = useForm<TransactionTypeFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: {
			id: transactionType?.id ?? generateGuid(),
			name: transactionType?.name ?? "",
			active: transactionType?.active ?? true
		}
	});

	useEffect(() => {
		if (transactionType) {
			reset(transactionType);
		}
	}, [transactionType, reset]);

	const [icon, setIcon] = useState<File | null>(null);
	const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);

	const iconUrl = customIconUrl ?? (transactionType?.iconKey ? getTransactionTypeIconUrl(transactionType.iconKey) : null);

	const onSubmit = (formData: TransactionTypeFormInput) => {
		onSaved({ ...formData, iconKey: transactionType?.iconKey } as TransactionTypeEntity, icon);
		modalRef?.current?.closeModal();
	};

	const handleFormSubmit: React.FormEventHandler = (event) => {
		handleSubmit(onSubmit)(event);
	};

	const onImageSelected = (url: string, image: File) => {
		setIcon(image);
		setCustomIconUrl(url);
	};

	const onModalVisibilityChanged = (open: boolean) => {
		if (!open) {
			setIcon(null);
			setCustomIconUrl(null);
			onModalClosed();
		}
	};

	return (
		<BaseFormModal visibilityChanged={onModalVisibilityChanged} ref={modalRef} title={t("entity_transaction_type_name_form_title")} submitHandler={handleFormSubmit}>
			<ImageInput imageUrl={iconUrl} onImageSelected={onImageSelected} />
			<Field.Root invalid={!!errors.name}>
				<Field.Label>{t("entity_transaction_type_name")}</Field.Label>
				<Input {...register("name")} autoComplete="off" placeholder='grocery' />
				<Field.ErrorText>{errors.name?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root invalid={!!errors.active} mt={4}>
				<CheckboxInput name="active" control={control} title={t("entity_transaction_type_active")} />
				<Field.ErrorText>{errors.active?.message}</Field.ErrorText>
			</Field.Root>
		</BaseFormModal>
	);
};

export default TransactionTypeModal;