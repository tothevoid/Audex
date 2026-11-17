import { Field } from "@chakra-ui/react";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { UserProfileFormInput, getUserProfileValidationSchema } from "./UserProfileValidationSchema";
import { useCurrencies } from "@/shared/hooks/queries/useCurrencies";
import { queryKeys } from "@/shared/constants/queryKeys";
import { getTimeZones } from "@/api/common/timeZoneApi";
import { getLanguages } from "@/api/common/languageApi";
import { updateUserProfile } from "@/api/user/userProfileApi";
import { UserProfileEntity } from "@/models/user/UserProfileEntity";
import { TimeZoneEntity } from "@/models/common/TimeZoneEntity";
import { LanguageEntity } from "@/models/common/LanguageEntity";
import CollectionSelect from "@/shared/components/CollectionSelect/CollectionSelect";
import BaseSelect from "@/shared/components/BaseSelect/BaseSelect";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";
import { useUserProfile } from "./hooks/UserProfileContext";
import { useColorMode } from "@/shared/context/useColorMode";

interface State {
	languages: LanguageEntity[];
	timeZones: TimeZoneEntity[];
}

const getFormDefaultValues = (
	userProfile: UserProfileEntity | null,
	timeZones: TimeZoneEntity[] = []
) => {
	const matchedTimeZone = timeZones.find(timeZone => timeZone.id === userProfile?.timeZoneId) ?? timeZones[0];

	return {
		id: userProfile?.id ?? "",
		language: userProfile?.language,
		currency: userProfile?.currency,
		timeZone: matchedTimeZone
	};
};

const UserProfileSettingsModal = forwardRef<BaseModalRef>((_, ref) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data: currencies = [] } = useCurrencies();
	const [state, setState] = useState<State>({ languages: [], timeZones: [] });
	const { user, updateUser } = useUserProfile();
	const modalRef = useRef<BaseModalRef>(null);

	useImperativeHandle(ref, () => ({
		openModal: () => modalRef.current?.openModal(),
		closeModal: () => modalRef.current?.closeModal()
	}));

	useEffect(() => {
		const initData = async () => {
			const [timeZones, loadedLanguages] = await Promise.all([
				getTimeZones(),
				getLanguages()
			]);
			setState({
				timeZones: timeZones ?? [],
				languages: loadedLanguages ?? []
			});
		};
		initData();
	}, []);

	const validationSchema = useMemo(() => getUserProfileValidationSchema(t), [t]);

	const { reset, handleSubmit, control, formState: { errors } } = useForm<UserProfileFormInput>({
		resolver: zodResolver(validationSchema),
		mode: "onBlur",
		defaultValues: getFormDefaultValues(user, state.timeZones)
	});

	useEffect(() => {
		if (user && state.timeZones.length > 0) {
			reset(getFormDefaultValues(user, state.timeZones));
		}
	}, [user, state.timeZones, reset]);

	const onVisibilityChanged = (open: boolean) => {
		if (open && user) {
			reset(getFormDefaultValues(user, state.timeZones));
			setSelectedTheme(themeOptions.find(option => option.value === colorMode) ?? themeOptions[0]);
		}
	};

	const onSubmit = async (userProfileForm: UserProfileFormInput) => {
		const isCurrencyChanged = user?.currency.id !== userProfileForm.currency.id;
		const userProfile: UserProfileEntity = {
			id: userProfileForm.id,
			userName: user?.userName ?? "",
			currency: currencies.find(currency => userProfileForm.currency.id === currency.id)!,
			language: userProfileForm.language,
			timeZoneId: userProfileForm.timeZone?.id
		};

		await updateUserProfile(userProfile);
		updateUser(userProfile);
		setColorMode(selectedTheme.value);

		if (isCurrencyChanged) {
			await queryClient.invalidateQueries({ queryKey: queryKeys.currencies.all });
		}
		modalRef.current?.closeModal();
	};

	const themeOptions = useMemo(() => [
		{ key: t("theme_dark"), value: "dark" as const },
		{ key: t("theme_light"), value: "light" as const },
		{ key: t("theme_system"), value: "system" as const },
	], [t]);

	const { colorMode, setColorMode } = useColorMode();
	const [selectedTheme, setSelectedTheme] = useState(
		themeOptions.find(option => option.value === colorMode) ?? themeOptions[0]
	);

	useEffect(() => {
		setSelectedTheme(themeOptions.find(option => option.value === colorMode) ?? themeOptions[0]);
	}, [colorMode, themeOptions]);

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
					collection={currencies}
					labelSelector={(currency => currency.name)}
					valueSelector={(currency => currency.id)}
				/>
				<Field.ErrorText>{errors.currency?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.language}>
				<Field.Label>{t("user_profile_settings_language")}</Field.Label>
				<CollectionSelect
					name="language"
					control={control}
					placeholder={t("user_profile_settings_language_placeholder")}
					collection={state.languages}
					labelSelector={(language => language.name)}
					valueSelector={(language => language.code)}
				/>
				<Field.ErrorText>{errors.language?.message}</Field.ErrorText>
			</Field.Root>
			<Field.Root mt={4} invalid={!!errors.timeZone}>
				<Field.Label>{t("user_profile_settings_timezone")}</Field.Label>
				<CollectionSelect
					name="timeZone"
					control={control}
					placeholder={t("user_profile_settings_timezone_placeholder")}
					collection={state.timeZones}
					labelSelector={(timeZone => timeZone.displayName)}
					valueSelector={(timeZone => timeZone.id)}
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
	);
});

export default UserProfileSettingsModal;