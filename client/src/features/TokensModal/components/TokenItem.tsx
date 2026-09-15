import React, { useState } from 'react';
import { Badge, Box, Button, Flex, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdClose } from 'react-icons/md';
import { formatDateTime } from '../../../shared/utilities/formatters/dateFormatter';
import { UserRefreshTokenEntity } from '../../../models/auth/UserRefreshTokenEntity';
import { parseDeviceAndBrowser } from '../../../shared/utilities/deviceUtilities';

interface TokenItemProps {
    token: UserRefreshTokenEntity;
    onRevoke?: (id: string) => Promise<void>;
}

export const TokenItem: React.FC<TokenItemProps> = ({ token, onRevoke }) => {
    const { t, i18n } = useTranslation();
    const [isRevoking, setIsRevoking] = useState(false);

    const { name: deviceName, icon: DeviceIcon } = parseDeviceAndBrowser(token.userAgent);
    const displayDevice = deviceName || t('tokens_unknown_device');
    const ipAddress = token.createdByIp || t('tokens_unknown_ip');
    const isExpired = new Date(token.expiresAt) <= new Date();
    const isActive = !token.isRevoked && !token.isUsed && !isExpired;

    const handleRevoke = async () => {
        if (!onRevoke || isRevoking) return;
        setIsRevoking(true);
        try {
            await onRevoke(token.id);
        } finally {
            setIsRevoking(false);
        }
    };

    return (
        <Box
            p={3}
            borderRadius="xl"
            backgroundColor={token.isCurrent ? 'status_success_bg' : 'background_primary'}
            borderColor={token.isCurrent ? 'status_success_border' : 'border_primary'}
            borderWidth="1px"
            transition="all 0.15s ease"
            _hover={{
                backgroundColor: token.isCurrent ? 'status_success_bg' : 'background_secondary',
                borderColor: token.isCurrent ? 'action_primary' : 'border_primary'
            }}
        >
            <Flex justify="space-between" align="center">
                <HStack gap={3} align="center" flex="1" minW="0">
                    {/* Device Icon */}
                    <Flex
                        w="36px"
                        h="36px"
                        borderRadius="lg"
                        backgroundColor={token.isCurrent ? 'status_success_bg' : 'background_secondary'}
                        color={token.isCurrent ? 'status_success' : 'text_primary'}
                        align="center"
                        justify="center"
                        fontSize="20px"
                        flexShrink={0}
                    >
                        <DeviceIcon />
                    </Flex>

                    {/* Info */}
                    <VStack align="start" gap={0.5} flex="1" minW="0">
                        <HStack gap={2} align="center" flexWrap="wrap">
                            <Text
                                fontSize="sm"
                                fontWeight="semibold"
                                color="text_primary"
                                truncate
                                maxW="280px"
                            >
                                {displayDevice}
                            </Text>
                            {token.isCurrent && (
                                <Badge
                                    size="xs"
                                    px={2}
                                    py={0.5}
                                    borderRadius="full"
                                    backgroundColor="status_success_bg"
                                    color="status_success"
                                    border="1px solid"
                                    borderColor="status_success_border"
                                    fontWeight="semibold"
                                >
                                    {t('tokens_current_badge')}
                                </Badge>
                            )}
                        </HStack>

                        <HStack gap={2} fontSize="xs" color="text_secondary">
                            <Text>{ipAddress}</Text>
                            <Text>•</Text>
                            <Text>
                                {t('tokens_logged_in')}: {formatDateTime(new Date(token.createdAt), i18n)}
                            </Text>
                        </HStack>
                    </VStack>
                </HStack>

                {/* Revoke Action */}
                {isActive && !token.isCurrent && onRevoke && (
                    <Button
                        size="xs"
                        variant="ghost"
                        color="status_danger"
                        borderRadius="lg"
                        px={2}
                        _hover={{
                            backgroundColor: 'status_danger_bg',
                            color: 'card_action_icon_danger'
                        }}
                        loading={isRevoking}
                        onClick={handleRevoke}
                        title={t('tokens_terminate_button')}
                        display="flex"
                        alignItems="center"
                        gap={1}
                    >
                        <Icon fontSize="14px">
                            <MdClose />
                        </Icon>
                        <Text fontSize="xs">{t('tokens_terminate_button')}</Text>
                    </Button>
                )}
            </Flex>
        </Box>
    );
};
