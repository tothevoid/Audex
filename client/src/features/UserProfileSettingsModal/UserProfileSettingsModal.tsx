import { Field } from "@chakra-ui/react"
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { UserProfileFormInput, getUserProfileValidationSchema } from "./UserProfileValidationSchema";
import { getCurrencies } from "../../api/currencies/currencyApi";
import { getTimeZones } from "../../api/common/timeZoneApi";
import { updateUserProfile } from "../../api/user/userProfileApi";
import { CurrencyEntity } from "../../models/currencies/CurrencyEntity";
import { UserProfileEntity } from "../../models/user/UserProfileEntity";
import { TimeZoneEntity } from "../../models/common/TimeZoneEntity";
import CollectionSelect from "../../shared/components/CollectionSelect/CollectionSelect";
import BaseSelect from "../../shared/components/BaseSelect/BaseSelect";
import { BaseModalRef } from "../../shared/utilities/modalUtilities";
import BaseFormModal from "../../shared/modals/BaseFormModal/BaseFormModal";
import { useUserProfile } from "./hooks/UserProfileContext";
import { useColorMode } from "../../shared/context/ColorModeContext";

interface State {
	currencies: CurrencyEntity[]
	languages: {key: string, value: string}[]
	timeZones: TimeZoneEntity[]
}

const langMapping = new Map<string, string>([
	["English", "en-US"],
	["Русский", "ru-RU" ],
]);

const languages = [...langMapping.entries()].map(([key, value]) => {return {key, value}});

const convertToSchemaValues = (userProfile: UserProfileEntity | null, timeZones: TimeZoneEntity[] = []) => {
	const userTzId = userProfile?.timeZoneId || Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow";
	const matchedTz = timeZones.find(tz => tz.id === userTzId);
	return {
		id: userProfile?.id ?? "",
		languageCode: languages.find((lang) => lang.value === userProfile?.languageCode) ?? languages[0],
		currency: userProfile?.currency,
		timeZone: matchedTz ?? (timeZones.length > 0 ? timeZones[0] : { id: userTzId, displayName: userTzId, baseUtcOffsetMinutes: 0 })
	}
}

const UserProfileSettingsModal = forwardRef<BaseModalRef>((_, ref) => {	 
	const { t } = useTranslation();
	const [state, setState] = useState<State>({currencies: [], languages: languages, timeZones: []})
	const { user, updateUser } = useUserProfile();
	const modalRef = useRef<BaseModalRef>(null);

	useImperativeHandle(ref, () => ({
		openModal: () => modalRef.current?.openModal(),
		closeModal: () => modalRef.current?.closeModal()
	}));

	useEffect(() => {
		const initData = async () => {
			const [currencies, timeZones] = await Promise.all([
				getCurrencies(),
				getTimeZones()
			]);
			setState(currentState => ({
				...currentState,
				currencies: currencies ?? [],
				timeZones: timeZones ?? []
			}));
		}
		initData();
	}, []);

	const validationSchema = useMemo(() => getUserProfileValidationSchema(t), [t]);

	const { reset, handleSubmit, control, formState: { errors }} = useForm<UserProfileFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: convertToSchemaValues(user, state.timeZones)
	});

	useEffect(() => {
		if (user && state.timeZones.length > 0) {
			reset(convertToSchemaValues(user, state.timeZones));
		}
	}, [user, state.timeZones, reset]);

	const onVisibilityChanged = (open: boolean) => {
		if (open && user) {
			reset(convertToSchemaValues(user, state.timeZones));
			setSelectedTheme(themeOptions.find(opt => opt.value === colorMode) ?? themeOptions[0]);
		}
	}

	const onSubmit = async (userProfileForm: UserProfileFormInput) => {
		const userProfile: UserProfileEntity = {
			id: userProfileForm.id,
			userName: user?.userName ?? "",
			currency: state.currencies.find(currency => userProfileForm.currency.id === currency.id)!,
			languageCode: userProfileForm.languageCode.value,
			timeZoneId: userProfileForm.timeZone?.id || user?.timeZoneId || "Europe/Moscow"
		}

		await updateUserProfile(userProfile);
		updateUser(userProfile);
		setColorMode(selectedTheme.value);
		modalRef.current?.closeModal();
	}

	const themeOptions = [
		{ key: t("theme_dark"), value: "dark" as const },
		{ key: t("theme_light"), value: "light" as const },
		{ key: t("theme_system"), value: "system" as const },
	];

	const { colorMode, setColorMode } = useColorMode();
	const [selectedTheme, setSelectedTheme] = useState(
		themeOptions.find(opt => opt.value === colorMode) ?? themeOptions[0]
	);

	useEffect(() => {
		setSelectedTheme(themeOptions.find(opt => opt.value === colorMode) ?? themeOptions[0]);
	}, [colorMode, t]);

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
			<Field.Root mt={4} invalid={!!errors.timeZone}>
				<Field.Label>{t("user_profile_settings_timezone")}</Field.Label>
				<CollectionSelect
					name="timeZone"
					control={control}
					placeholder={t("user_profile_settings_timezone_placeholder")}
					collection={state.timeZones}
					labelSelector={(tz => tz.displayName)}
					valueSelector={(tz => tz.id)}
				/>
				<Field.ErrorText>{errors.timeZone?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root mt={4}>
				<Field.Label>{t("user_profile_settings_theme")}</Field.Label>
				<BaseSelect
					placeholder={t("user_profile_settings_theme_placeholder")}
					collection={themeOptions}
					selectedValue={selectedTheme}
					labelSelector={(item) => item.key}
					valueSelector={(item) => item.value}
					onSelected={(item) => {
						if (item) {
							setSelectedTheme(item);
						}
					}}
				/>
			</Field.Root>
		</BaseFormModal>
	)
})

export default UserProfileSettingsModal