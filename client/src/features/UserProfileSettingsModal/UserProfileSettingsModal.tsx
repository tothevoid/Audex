import { Field } from "@chakra-ui/react"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { UserProfileFormInput, UserProfileValidationSchema } from "./UserProfileValidationSchema";
import { getCurrencies } from "../../api/currencies/currencyApi";
import { updateUserProfile } from "../../api/user/userProfileApi";
import { CurrencyEntity } from "../../models/currencies/CurrencyEntity";
import { UserProfileEntity } from "../../models/user/UserProfileEntity";
import CollectionSelect from "../../shared/components/CollectionSelect/CollectionSelect";
import { BaseModalRef } from "../../shared/utilities/modalUtilities";
import BaseFormModal from "../../shared/modals/BaseFormModal/BaseFormModal";
import { useUserProfile } from "./hooks/UserProfileContext";

interface State {
	currencies: CurrencyEntity[]
	languages: {key: string, value: string}[]
}

const langMapping = new Map<string, string>([
	["English", "en-US"],
	["Русский", "ru-RU" ],
]);

const languages = [...langMapping.entries()].map(([key, value]) => {return {key, value}});

const convertToSchemaValues = (userProfile: UserProfileEntity | null) => {
	return {
		id: userProfile?.id ?? "",
		languageCode: languages.find((lang) => lang.value === userProfile?.languageCode) ?? languages[0],
		currency: userProfile?.currency
	}
}

const UserProfileSettingsModal = forwardRef<BaseModalRef>((_, ref) => {	 
	const [state, setState] = useState<State>({currencies: [], languages: languages})
	const { user, updateUser } = useUserProfile();
	const modalRef = useRef<BaseModalRef>(null);

	useImperativeHandle(ref, () => ({
		openModal: () => modalRef.current?.openModal(),
		closeModal: () => modalRef.current?.closeModal()
	}));

	useEffect(() => {
		const initData = async () => {
			await initCurrencies();
		}
		initData();
	}, []);

	const initCurrencies = async () => {
		const currencies = await getCurrencies();
		setState((currentState) => {
			return {...currentState, currencies}
		})
	};

	const { reset, handleSubmit, control, formState: { errors }} = useForm<UserProfileFormInput>({
		resolver: zodResolver(UserProfileValidationSchema),
		mode: "onBlur",
		defaultValues: convertToSchemaValues(user)
	});

	const onVisibilityChanged = (open: boolean) => {
		if (open && user) {
			reset(convertToSchemaValues(user));
		}
	}

	const onSubmit = async (userProfileForm: UserProfileFormInput) => {
		const userProfile: UserProfileEntity = {
			id: userProfileForm.id,
			userName: user?.userName ?? "",
			currency: state.currencies.find(currency => userProfileForm.currency.id === currency.id)!,
			languageCode: userProfileForm.languageCode.value,
		}

		await updateUserProfile(userProfile);
		updateUser(userProfile);
		modalRef.current?.closeModal();
	}

	const { t } = useTranslation();

	return (
		<BaseFormModal
			ref={modalRef}
			title={t("user_profile_settings_title")}
			submitHandler={handleSubmit(onSubmit)}
			visibilityChanged={onVisibilityChanged}
		>
			<Field.Root mt={4} invalid={!!errors.currency}>
				<Field.Label>{t("user_profile_settings_currency")}</Field.Label>
				<CollectionSelect
					name="currency"
					control={control}
					placeholder={t("user_profile_settings_currency_placeholder")}
					collection={state.currencies}
					labelSelector={(currency => currency.name)}
					valueSelector={(currency => currency.id)}
				/>
				<Field.ErrorText>{errors.currency?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.languageCode}>
				<Field.Label>{t("user_profile_settings_language")}</Field.Label>
				<CollectionSelect
					name="languageCode"
					control={control}
					placeholder={t("user_profile_settings_language_placeholder")}
					collection={state.languages}
					labelSelector={(language => language.key)}
					valueSelector={(language => language.value)}
				/>
				<Field.ErrorText>{errors.languageCode?.message}</Field.ErrorText>
			</Field.Root>
		</BaseFormModal>
	)
})

export default UserProfileSettingsModal