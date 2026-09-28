import { Field, Input } from "@chakra-ui/react"
import React, { RefObject, useEffect, useMemo, useState } from "react"
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

const TransactionTypeModal: React.FC<ModalProps> = (props: ModalProps) => {
	const {t} = useTranslation();
	const validationSchema = useMemo(() => getTransactionTypeValidationSchema(t), [t]);

	const { register, reset, handleSubmit, control, formState: { errors }} = useForm<TransactionTypeFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: {
			id: props.transactionType?.id ?? generateGuid(),
			name: props.transactionType?.name ?? "",
			active: props.transactionType?.active ?? true
		}
	});

	useEffect(() => {
		if (props.transactionType) {
			reset(props.transactionType);
		}
	}, [props.transactionType]);

	const onSubmit = (transactionType: TransactionTypeFormInput) => {
		props.onSaved({...transactionType, iconKey: props.transactionType?.iconKey } as TransactionTypeEntity, icon);
		props.modalRef?.current?.closeModal();
	}

	const [icon, setIcon] = useState<File | null>(null);
	const [iconUrl, setIconUrl] = useState<string | null>(null);

	useEffect(() => {
		const url = getTransactionTypeIconUrl(props.transactionType?.iconKey);
		setIconUrl(url);
	}, [props.transactionType]);

	const onImageSelected = (url: string, image: File) => {
        setIcon(image);
        setIconUrl(url);
    }

	const onModalVisibilityChanged = (open: boolean) => {
		if (!open) {
			props.onModalClosed();
		}
	}

	return <BaseFormModal visibilityChanged={onModalVisibilityChanged} ref={props.modalRef} title={t("entity_transaction_type_name_form_title")} submitHandler={handleSubmit(onSubmit)}>
		<ImageInput imageUrl={iconUrl} onImageSelected={onImageSelected}/>
		<Field.Root invalid={!!errors.name}>
			<Field.Label>{t("entity_transaction_type_name")}</Field.Label>
			<Input {...register("name")} autoComplete="off" placeholder='grocery' />
			<Field.ErrorText>{errors.name?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root invalid={!!errors.active} mt={4}>
			<CheckboxInput name="active" control={control} title={t("entity_transaction_type_active")}/>
			<Field.ErrorText>{errors.active?.message}</Field.ErrorText>
		</Field.Root>
	</BaseFormModal>
}

export default TransactionTypeModal