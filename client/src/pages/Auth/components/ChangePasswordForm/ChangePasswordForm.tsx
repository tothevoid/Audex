
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Input, Field, Flex, Text, VStack, IconButton } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { MdVisibility, MdVisibilityOff, MdErrorOutline, MdArrowBack } from "react-icons/md";
import { changePassword } from "../../../../api/auth/authApi";
import { AuthErrorCode } from "../../../../models/auth/AuthResult";
import { ChangePasswordFormInput, getChangePasswordValidationSchema } from "./ChangePasswordFormValidationSchema";
import { Nullable } from "../../../../shared/utilities/nullable";

interface Props {
    defaultPasswordResetValues: { userName: string; currentPassword: Nullable<string> };
    onTokenReceived: (token: string) => void;
    onBackToAuth?: () => void;
}

const ChangePasswordForm: React.FC<Props> = ({ defaultPasswordResetValues, onTokenReceived, onBackToAuth }) => {
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [error, setError] = useState("");

    const getDefaultValues = useCallback(() => {
        return {
            userName: defaultPasswordResetValues?.userName ?? "",
            currentPassword: defaultPasswordResetValues?.currentPassword ?? "",
            newPassword: "",
            confirmPassword: ""
        };
    }, [defaultPasswordResetValues]);

    const { t } = useTranslation();
    const validationSchema = useMemo(() => getChangePasswordValidationSchema(t), [t]);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ChangePasswordFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: getDefaultValues()
    });

    useEffect(() => {
        reset(getDefaultValues());
    }, [defaultPasswordResetValues, reset, getDefaultValues]);

    const onSubmit = async (authData: ChangePasswordFormInput) => {
        setError("");
        setLoading(true);
        try {
            const result = await changePassword(
                authData.userName,
                authData.currentPassword,
                authData.newPassword
            );

            if (result.success) {
                onTokenReceived(result.token);
                return;
            }

            switch (result.errorCode) {
                case AuthErrorCode.ServerUnavailable:
                    setError(t("auth_form_error_server_unavailable"));
                    break;
                case AuthErrorCode.InvalidCredentials:
                    setError(t("change_password_form_error_invalid_credentials"));
                    break;
                default:
                    setError(t("change_password_form_error"));
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit(onSubmit)} w="100%">
            <VStack gap={4} align="stretch" w="100%">
                <Text
                    fontSize="md"
                    color="text_secondary"
                    textAlign="center"
                    mb={1}
                >
                    {t("change_password_form_title")}
                </Text>

                <Field.Root invalid={!!errors.userName} w="100%">
                    <Field.Label color="text_secondary" fontSize="sm" fontWeight="medium">
                        {t("change_password_form_username")}
                    </Field.Label>
                    <Input
                        {...register("userName")}
                        autoComplete="username"
                        color="text_primary"
                        backgroundColor="background_secondary"
                        borderColor="border_primary"
                        _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                        _focusVisible={{ borderColor: "action_primary", boxShadow: "0 0 0 1px {colors.action_primary}" }}
                        placeholder={t("change_password_form_username")}
                        size="lg"
                        w="100%"
                    />
                    <Field.ErrorText color="loss" fontSize="xs">
                        {errors.userName?.message}
                    </Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.currentPassword} w="100%">
                    <Field.Label color="text_secondary" fontSize="sm" fontWeight="medium">
                        {t("change_password_form_current_password")}
                    </Field.Label>
                    <Flex position="relative" align="center" w="100%">
                        <Input
                            type={showCurrentPassword ? "text" : "password"}
                            {...register("currentPassword")}
                            autoComplete="current-password"
                            color="text_primary"
                            backgroundColor="background_secondary"
                            borderColor="border_primary"
                            _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                            _focusVisible={{ borderColor: "action_primary", boxShadow: "0 0 0 1px {colors.action_primary}" }}
                            placeholder={t("change_password_form_current_password")}
                            size="lg"
                            w="100%"
                            pr="44px"
                        />
                        <IconButton
                            aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                            variant="ghost"
                            size="sm"
                            position="absolute"
                            right="6px"
                            color="text_secondary"
                            _hover={{ color: "text_primary", bg: "transparent" }}
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            tabIndex={-1}
                        >
                            {showCurrentPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                        </IconButton>
                    </Flex>
                    <Field.ErrorText color="loss" fontSize="xs">
                        {errors.currentPassword?.message}
                    </Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.newPassword} w="100%">
                    <Field.Label color="text_secondary" fontSize="sm" fontWeight="medium">
                        {t("change_password_form_new_password")}
                    </Field.Label>
                    <Flex position="relative" align="center" w="100%">
                        <Input
                            type={showNewPassword ? "text" : "password"}
                            {...register("newPassword")}
                            autoComplete="new-password"
                            color="text_primary"
                            backgroundColor="background_secondary"
                            borderColor="border_primary"
                            _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                            _focusVisible={{ borderColor: "action_primary", boxShadow: "0 0 0 1px {colors.action_primary}" }}
                            placeholder={t("change_password_form_new_password")}
                            size="lg"
                            w="100%"
                            pr="44px"
                        />
                        <IconButton
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                            variant="ghost"
                            size="sm"
                            position="absolute"
                            right="6px"
                            color="text_secondary"
                            _hover={{ color: "text_primary", bg: "transparent" }}
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            tabIndex={-1}
                        >
                            {showNewPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                        </IconButton>
                    </Flex>
                    <Field.ErrorText color="loss" fontSize="xs">
                        {errors.newPassword?.message}
                    </Field.ErrorText>
                </Field.Root>

                {error && (
                    <Flex
                        align="center"
                        gap={2.5}
                        bg="pnl_negative_bg"
                        borderColor="pnl_negative_border"
                        borderWidth="1px"
                        borderRadius="md"
                        p={3}
                        color="loss"
                        fontSize="sm"
                    >
                        <MdErrorOutline size={20} style={{ flexShrink: 0 }} />
                        <Text>{error}</Text>
                    </Flex>
                )}

                <Button
                    loading={loading}
                    type="submit"
                    bg="action_primary"
                    color="white"
                    _hover={{ opacity: 0.9 }}
                    _active={{ opacity: 0.8 }}
                    w="full"
                    size="lg"
                    mt={2}
                    fontWeight="semibold"
                >
                    {t("change_password_form_submit_button")}
                </Button>

                {onBackToAuth && (
                    <Button
                        type="button"
                        variant="ghost"
                        color="text_secondary"
                        _hover={{ color: "text_primary", backgroundColor: "background_secondary" }}
                        w="full"
                        size="md"
                        onClick={onBackToAuth}
                    >
                        <MdArrowBack style={{ marginRight: 6 }} />
                        {t("change_password_form_back_to_login")}
                    </Button>
                )}
            </VStack>
        </Box>
    );
};

export default ChangePasswordForm;

