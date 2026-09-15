import React, { useState, useMemo } from 'react';
import {
    Box,
    Button,
    Card,
    Flex,
    Icon,
    Spinner,
    Text,
    VStack
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdBackup, MdDownload, MdLock, MdShield } from 'react-icons/md';
import { exportDatabaseBackup } from '../../../api/system/databaseBackupApi';
import { PasswordInput } from '../../../shared/components/PasswordInput/PasswordInput';
import SwitchInput from '../../../shared/components/SwitchInput/SwitchInput';

export const ActionsModalBackupCard: React.FC = () => {
    const { t } = useTranslation();
    const [isProtected, setIsProtected] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const passwordStrength = useMemo(() => {
        if (!password) return { level: 0, text: '', color: 'gray.500' };
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) {
            return { level: 1, text: t("action_backup_strength_weak"), color: 'red.400' };
        } else if (score <= 4) {
            return { level: 2, text: t("action_backup_strength_medium"), color: 'yellow.400' };
        } else {
            return { level: 3, text: t("action_backup_strength_strong"), color: 'green.400' };
        }
    }, [password, t]);

    const handleDownloadBackup = async () => {
        setErrorMessage(null);

        if (isProtected) {
            if (!password.trim()) {
                setErrorMessage(t("action_backup_password_empty"));
                return;
            }
            if (password !== confirmPassword) {
                setErrorMessage(t("action_backup_password_mismatch"));
                return;
            }
        }

        setIsLoading(true);
        try {
            const result = await exportDatabaseBackup(isProtected ? password : undefined);
            if (result && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const a = document.createElement('a');
                a.href = url;
                if (result.fileName) {
                    a.download = result.fileName;
                }
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            }
        } catch (e: unknown) {
            const err = e as { message?: string };
            setErrorMessage(err?.message || t("action_restore_error"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card.Root
            variant="outline"
            borderColor="border_primary"
            backgroundColor="background_secondary"
            borderRadius="md"
        >
            <Card.Body p={4}>
                <VStack align="stretch" gap={4}>
                    <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align={{ base: 'stretch', sm: 'center' }} gap={4}>
                        <Flex align="center" gap={3}>
                            <Flex
                                w="44px"
                                h="44px"
                                borderRadius="lg"
                                bg="green.500/15"
                                color="green.400"
                                align="center"
                                justify="center"
                                flexShrink={0}
                            >
                                <Icon fontSize="24px">
                                    <MdBackup />
                                </Icon>
                            </Flex>
                            <Box>
                                <Text fontWeight="bold" fontSize="md" color="text_primary">
                                    {t("action_backup_title")}
                                </Text>
                                <Text fontSize="xs" color="gray.400" mt={1}>
                                    {t("action_backup_desc")}
                                </Text>
                            </Box>
                        </Flex>
                        <Button
                            colorPalette="green"
                            variant="subtle"
                            size="sm"
                            onClick={handleDownloadBackup}
                            disabled={isLoading}
                            minW="140px"
                        >
                            {isLoading ? (
                                <>
                                    <Spinner size="xs" mr={2} />
                                    {t("action_backup_downloading")}
                                </>
                            ) : (
                                <>
                                    <Icon mr={1}>
                                        <MdDownload />
                                    </Icon>
                                    {t("action_backup_download_btn")}
                                </>
                            )}
                        </Button>
                    </Flex>

                    {/* Zero-Knowledge Protection Toggle */}
                    <Box pt={2} borderTopWidth="1px" borderColor="border_primary">
                        <Flex align="center" justify="space-between">
                            <Flex align="center" gap={2}>
                                <Icon color="teal.400">
                                    <MdShield />
                                </Icon>
                                <Text fontSize="sm" fontWeight="medium" color="text_primary">
                                    {t("action_backup_protect_toggle")}
                                </Text>
                            </Flex>
                            <SwitchInput
                                checked={isProtected}
                                onCheckedChange={(checked) => {
                                    setIsProtected(checked);
                                    setErrorMessage(null);
                                }}
                                colorPalette="teal"
                                size="sm"
                            />
                        </Flex>

                        {isProtected && (
                            <VStack align="stretch" gap={3} mt={3} p={3} borderRadius="md" bg="background_primary" borderWidth="1px" borderColor="teal.500/30">
                                <Box>
                                    <Flex align="center" gap={2} mb={1}>
                                        <Icon color="gray.400" fontSize="xs">
                                            <MdLock />
                                        </Icon>
                                        <Text fontSize="xs" color="gray.400">
                                            {t("action_backup_password_placeholder")}
                                        </Text>
                                        {password && (
                                            <Text fontSize="xs" fontWeight="bold" color={passwordStrength.color} ml="auto">
                                                {passwordStrength.text}
                                            </Text>
                                        )}
                                    </Flex>
                                    <PasswordInput
                                        disableAutofill
                                        name="backup_encryption_key"
                                        placeholder={t("action_backup_password_placeholder")}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </Box>

                                <Box>
                                    <Text fontSize="xs" color="gray.400" mb={1}>
                                        {t("action_backup_password_confirm_placeholder")}
                                    </Text>
                                    <PasswordInput
                                        disableAutofill
                                        name="backup_encryption_key_confirm"
                                        placeholder={t("action_backup_password_confirm_placeholder")}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </Box>

                                <Text fontSize="xs" color="teal.300" lineHeight="1.4">
                                    {t("action_backup_info_banner")}
                                </Text>
                            </VStack>
                        )}

                        {errorMessage && (
                            <Text fontSize="xs" color="red.400" mt={2}>
                                {errorMessage}
                            </Text>
                        )}
                    </Box>
                </VStack>
            </Card.Body>
        </Card.Root>
    );
};
