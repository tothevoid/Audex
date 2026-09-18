import React, { useRef, useState } from 'react';
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
import { MdAttachFile, MdCheckCircle, MdError, MdLock, MdRestore } from 'react-icons/md';
import { restoreDatabaseBackup, validateDatabaseBackup } from '../../../api/system/databaseBackupApi';
import { ConfirmModal } from '../../../shared/modals/ConfirmModal/ConfirmModal';
import { BaseModalRef } from '../../../shared/utilities/modalUtilities';
import { PasswordInput } from '../../../shared/components/PasswordInput/PasswordInput';

export const ActionsModalRestoreCard: React.FC = () => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const confirmModalRef = useRef<BaseModalRef>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [isValidFile, setIsValidFile] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setStatusMessage(null);
        setIsEncrypted(false);
        setIsValidFile(false);

        // Pre-validate with backend (backend inspects binary structure & encryption format)
        setIsValidating(true);
        try {
            const validation = await validateDatabaseBackup(file);
            setIsEncrypted(validation.isEncrypted);
            setIsValidFile(validation.isValid);

            if (!validation.isValid && validation.errorMessage) {
                setStatusMessage({
                    type: 'error',
                    text: validation.errorMessage
                });
            }
        } catch (err: unknown) {
            setIsValidFile(false);
            const error = err as { message?: string };
            setStatusMessage({
                type: 'error',
                text: error?.message ?? 'Validation failed'
            });
        } finally {
            setIsValidating(false);
        }
    };

    const handleRestoreClick = () => {
        if (!selectedFile || !isValidFile) return;
        confirmModalRef.current?.openModal();
    };

    const handleConfirmedRestore = async () => {
        if (!selectedFile || !isValidFile) return;

        setIsLoading(true);
        setStatusMessage(null);
        try {
            const result = await restoreDatabaseBackup(selectedFile, isEncrypted ? password : undefined);
            if (result.success) {
                setStatusMessage({
                    type: 'success',
                    text: t("action_restore_success")
                });
                setSelectedFile(null);
                setPassword('');
                setIsValidFile(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                // Automatically reload page to refresh all data caches
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setStatusMessage({
                    type: 'error',
                    text: `${t("action_restore_error")} ${result.message ?? ''}`
                });
            }
        } catch (e: unknown) {
            const err = e as { message?: string };
            setStatusMessage({
                type: 'error',
                text: `${t("action_restore_error")} ${err?.message ?? ''}`
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
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
                                    backgroundColor="background_primary"
                                    color="card_action_icon_primary"
                                    border="1px solid"
                                    borderColor="border_primary"
                                    align="center"
                                    justify="center"
                                    flexShrink={0}
                                >
                                    <Icon fontSize="24px">
                                        <MdRestore />
                                    </Icon>
                                </Flex>
                                <Box>
                                    <Text fontWeight="bold" fontSize="md" color="text_primary">
                                        {t("action_restore_title")}
                                    </Text>
                                    <Text fontSize="xs" color="text_secondary" mt={1}>
                                        {t("action_restore_desc")}
                                    </Text>
                                </Box>
                            </Flex>

                            <Button
                                size="sm"
                                onClick={handleRestoreClick}
                                disabled={!selectedFile || !isValidFile || isLoading || isValidating || (isEncrypted && !password.trim())}
                                minW="140px"
                            >
                                {isLoading ? (
                                    <>
                                        <Spinner size="xs" mr={2} />
                                        {t("action_restore_in_progress")}
                                    </>
                                ) : (
                                    <>
                                        <Icon mr={1}>
                                            <MdRestore />
                                        </Icon>
                                        {t("action_restore_btn")}
                                    </>
                                )}
                            </Button>
                        </Flex>

                        {/* File selector */}
                        <Box pt={2} borderTopWidth="1px" borderColor="border_primary">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".audexbackup,.zip"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <Flex align="center" gap={3}>
                                <Button
                                    size="xs"
                                    variant="outline"
                                    color="text_primary"
                                    backgroundColor="background_primary"
                                    borderColor="border_primary"
                                    _hover={{ backgroundColor: "gray.700", borderColor: "gray.500" }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Icon mr={1} color="orange.400">
                                        <MdAttachFile />
                                    </Icon>
                                    {t("action_restore_select_file")}
                                </Button>
                                {selectedFile && (
                                    <Text fontSize="xs" color="text_primary" truncate maxW="300px">
                                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                    </Text>
                                )}
                                {isValidating && <Spinner size="xs" color="orange.400" />}
                            </Flex>

                            {/* Encrypted file password input */}
                            {selectedFile && isEncrypted && (
                                <Box mt={3} p={3} borderRadius="md" bg="background_primary" borderWidth="1px" borderColor="orange.500/30">
                                    <Flex align="center" gap={2} mb={1}>
                                        <Icon color="orange.400" fontSize="xs">
                                            <MdLock />
                                        </Icon>
                                        <Text fontSize="xs" color="orange.300">
                                            {t("action_restore_encrypted_detected")}
                                        </Text>
                                    </Flex>
                                    <PasswordInput
                                        disableAutofill
                                        name="backup_decryption_key"
                                        placeholder={t("action_restore_password_placeholder")}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </Box>
                            )}

                            {/* Status message */}
                            {statusMessage && (
                                <Flex
                                    align="center"
                                    gap={2}
                                    mt={3}
                                    p={2}
                                    borderRadius="md"
                                    bg={statusMessage.type === 'success' ? 'green.900/30' : 'red.900/30'}
                                    borderWidth="1px"
                                    borderColor={statusMessage.type === 'success' ? 'green.600/40' : 'red.600/40'}
                                >
                                    <Icon color={statusMessage.type === 'success' ? 'green.400' : 'red.400'}>
                                        {statusMessage.type === 'success' ? <MdCheckCircle /> : <MdError />}
                                    </Icon>
                                    <Text fontSize="xs" color={statusMessage.type === 'success' ? 'green.300' : 'red.300'}>
                                        {statusMessage.text}
                                    </Text>
                                </Flex>
                            )}
                        </Box>
                    </VStack>
                </Card.Body>
            </Card.Root>

            <ConfirmModal
                ref={confirmModalRef}
                title={t("action_restore_confirm_title")}
                message={t("action_restore_confirm_desc")}
                confirmActionName={t("action_restore_btn")}
                onConfirmed={handleConfirmedRestore}
            />
        </>
    );
};
