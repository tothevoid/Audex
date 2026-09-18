import React, { useEffect, useState } from "react";
import { Box, Flex, Spinner, Text, VStack } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthForm from "./components/AuthForm/AuthForm";
import ChangePasswordForm from "./components/ChangePasswordForm/ChangePasswordForm";
import SetupForm from "./components/SetupForm/SetupForm";
import { Nullable } from "../../shared/utilities/nullable";
import AppIcon from "../../shared/components/AppIcon/AppIcon";
import { getAuthStatus } from "../../api/auth/authApi";

enum FormType {
    Loading,
    Setup,
    Auth,
    ChangePassword
}

const AuthPage: React.FC = () => {
    const [formType, setFormType] = useState<FormType>(FormType.Loading);
    const [setupUserName, setSetupUserName] = useState<string>("admin");

    const navigate = useNavigate();
    const location = useLocation();
    const rawFrom = location.state?.from;
    const from = rawFrom && !rawFrom.startsWith("/auth") ? rawFrom : "/";

    useEffect(() => {
        let isMounted = true;

        const checkStatus = async () => {
            const status = await getAuthStatus();
            if (!isMounted) return;

            if (status?.isSetupRequired) {
                setSetupUserName(status.userName || "admin");
                setFormType(FormType.Setup);
            } else {
                setFormType(FormType.Auth);
            }
        };

        checkStatus();

        return () => {
            isMounted = false;
        };
    }, []);

    const onTokenReceived = () => {
        navigate(from, { replace: true });
    };

    const [defaultPasswordResetValues, setDefaultPasswordResetValues] =
        useState<{ userName: string; currentPassword: Nullable<string> }>({ userName: "", currentPassword: null });

    const onPasswordChangeRequired = (userName: string, currentPassword: Nullable<string>) => {
        setDefaultPasswordResetValues({ userName, currentPassword });
        setFormType(FormType.ChangePassword);
    };

    const onBackToAuth = () => {
        setFormType(FormType.Auth);
    };

    return (
        <Flex
            minH="100vh"
            w="100vw"
            align="center"
            justify="center"
            backgroundColor="background_main"
            backgroundImage="radial-gradient(ellipse at 50% 15%, rgba(10, 142, 58, 0.12), transparent 50%), radial-gradient(ellipse at 80% 85%, rgba(117, 0, 175, 0.08), transparent 45%)"
            p={4}
        >
            <Box
                maxW="420px"
                w="100%"
                p={{ base: 6, sm: 8 }}
                borderRadius="2xl"
                backgroundColor="background_primary"
                borderColor="border_primary"
                borderWidth="1px"
                boxShadow="0 8px 32px rgba(0, 0, 0, 0.45)"
            >
                <VStack gap={4} align="stretch">
                    <Flex direction="column" align="center" justify="center" gap={2} mb={1}>
                        <AppIcon size="48px" color="action_primary" />
                        <Text fontSize="2xl" fontWeight="bold" color="text_primary" letterSpacing="0.05em">
                            Audex
                        </Text>
                    </Flex>

                    {formType === FormType.Loading && (
                        <Flex justify="center" align="center" minH="180px">
                            <Spinner size="lg" color="action_primary" />
                        </Flex>
                    )}

                    {formType === FormType.Setup && (
                        <SetupForm
                            userName={setupUserName}
                            onTokenReceived={onTokenReceived}
                        />
                    )}

                    {formType === FormType.Auth && (
                        <AuthForm
                            onPasswordChangeRequired={onPasswordChangeRequired}
                            onTokenReceived={onTokenReceived}
                        />
                    )}

                    {formType === FormType.ChangePassword && (
                        <ChangePasswordForm
                            defaultPasswordResetValues={defaultPasswordResetValues}
                            onTokenReceived={onTokenReceived}
                            onBackToAuth={onBackToAuth}
                        />
                    )}
                </VStack>
            </Box>
        </Flex>
    );
};

export default AuthPage;
