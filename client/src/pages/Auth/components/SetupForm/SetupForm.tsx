import React, { useMemo, useState } from "react";
import { Box, Button, Input, Field, Flex, Text, VStack, IconButton } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { MdVisibility, MdVisibilityOff, MdErrorOutline } from "react-icons/md";
import { initialSetup } from "../../../../api/auth/authApi";
import { AuthErrorCode } from "../../../../models/auth/AuthResult";
import { SetupFormInput, getSetupValidationSchema } from "./SetupValidationSchema";

interface Props {
    userName: string;
    onTokenReceived: (token: string) => void;
}

const SetupForm: React.FC<Props> = ({ userName = "admin", onTokenReceived }) => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const { t } = useTranslation();
    const validationSchema = useMemo(() => getSetupValidationSchema(t), [t]);

    const { register, handleSubmit, formState: { errors } } = useForm<SetupFormInput>({
        resolver: zodResolver(validationSchema),
        mode: "onBlur",
        defaultValues: {
            password: "",
            confirmPassword: ""
        }
    });

    const onSubmit = async (data: SetupFormInput) => {
        setError("");
        setLoading(true);
        try {
            const result = await initialSetup(userName, data.password);

            if (!result.success) {
                switch (result.errorCode) {
                    case AuthErrorCode.ServerUnavailable:
                        setError(t("auth_form_error_server_unavailable"));
                        break;
                    default:
                        setError(t("setup_form_error"));
                        break;
                }
                return;
            }

            if (!result.passwordChangeRequired && result.token) {
                onTokenReceived(result.token);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit(onSubmit)} w="100%">
            <VStack gap={4} align="stretch" w="100%">
                <Box textAlign="center" mb={1}>
                    <Text fontSize="lg" fontWeight="semibold" color="text_primary">
                        {t("setup_form_title")}
                    </Text>
                    <Text fontSize="xs" color="text_secondary" mt={1}>
                        {t("setup_form_description")}
                    </Text>
                </Box>

                <Field.Root w="100%">
                    <Field.Label color="text_secondary" fontSize="sm" fontWeight="medium">
                        {t("setup_form_username")}
                    </Field.Label>
                    <Input
                        value={userName}
                        readOnly
                        disabled
                        tabIndex={-1}
                        color="text_secondary"
                        backgroundColor="background_secondary"
                        borderColor="border_primary"
                        opacity={0.7}
                        cursor="default"
                        size="lg"
                        w="100%"
                    />
                </Field.Root>

                <Field.Root invalid={!!errors.password} w="100%">
                    <Field.Label color="text_secondary" fontSize="sm" fontWeight="medium">
                        {t("setup_form_password")}
                    </Field.Label>
                    <Flex position="relative" align="center" w="100%">
                        <Input
                            type={showPassword ? "text" : "password"}
                            {...register("password")}
                            autoComplete="new-password"
                            color="text_primary"
                            backgroundColor="background_secondary"
                            borderColor="border_primary"
                            _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                            _focusVisible={{ borderColor: "action_primary", boxShadow: "0 0 0 1px {colors.action_primary}" }}
                            placeholder={t("setup_form_password")}
                            size="lg"
                            w="100%"
                            pr="44px"
                        />
                        <IconButton
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            variant="ghost"
                            size="sm"
                            position="absolute"
                            right="6px"
                            color="text_secondary"
                            _hover={{ color: "text_primary", bg: "transparent" }}
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                        </IconButton>
                    </Flex>
                    <Field.ErrorText color="loss" fontSize="xs">
                        {errors.password?.message}
                    </Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.confirmPassword} w="100%">
                    <Field.Label color="text_secondary" fontSize="sm" fontWeight="medium">
                        {t("setup_form_confirm_password")}
                    </Field.Label>
                    <Flex position="relative" align="center" w="100%">
                        <Input
                            type={showConfirmPassword ? "text" : "password"}
                            {...register("confirmPassword")}
                            autoComplete="new-password"
                            color="text_primary"
                            backgroundColor="background_secondary"
                            borderColor="border_primary"
                            _hover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                            _focusVisible={{ borderColor: "action_primary", boxShadow: "0 0 0 1px {colors.action_primary}" }}
                            placeholder={t("setup_form_confirm_password")}
                            size="lg"
                            w="100%"
                            pr="44px"
                        />
                        <IconButton
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            variant="ghost"
                            size="sm"
                            position="absolute"
                            right="6px"
                            color="text_secondary"
                            _hover={{ color: "text_primary", bg: "transparent" }}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                        </IconButton>
                    </Flex>
                    <Field.ErrorText color="loss" fontSize="xs">
                        {errors.confirmPassword?.message}
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
                    {t("setup_form_submit_button")}
                </Button>
            </VStack>
        </Box>
    );
};

export default SetupForm;
