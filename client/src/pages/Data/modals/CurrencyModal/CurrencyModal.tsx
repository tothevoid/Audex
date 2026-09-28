import { Field, Input} from "@chakra-ui/react";
import { RefObject, useMemo } from "react";
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
	modalRef: RefObject<BaseModalRef | null>,
	currency?: CurrencyEntity | null,
	onSaved: (account: CurrencyEntity) => void;
};

const CurrencyModal: React.FC<ModalProps> = (props: ModalProps) => {
	const { t } = useTranslation();
	const validationSchema = useMemo(() => getCurrencyModalValidationSchema(t), [t]);

	const { register, handleSubmit, control, formState: { errors }} = useForm<CurrencyFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: {
			id: props.currency?.id ?? generateGuid(),
			name: props.currency?.name ?? "",
			active: props.currency?.active ?? true,
		}
	});

	const onSubmit = (currency: CurrencyFormInput) => {
		props.onSaved(currency as CurrencyEntity);
		props.modalRef?.current?.closeModal();
	};

	return <BaseFormModal ref={props.modalRef} title={t("entity_currency_name_form_title")} submitHandler={handleSubmit(onSubmit)}>
		<Field.Root invalid={!!errors.name}>
			<Field.Label>{t("entity_currency_name")}</Field.Label>
			<Input {...register("name")} autoComplete="off" placeholder='USD' />
			<Field.ErrorText>{errors.name?.message}</Field.ErrorText>
		</Field.Root>
		<Field.Root invalid={!!errors.active} mt={4}>
			<CheckboxInput name="active" control={control} title={t("entity_currency_active")}/>
			<Field.ErrorText>{errors.active?.message}</Field.ErrorText>
		</Field.Root>
	</BaseFormModal>;

};

export default CurrencyModal;