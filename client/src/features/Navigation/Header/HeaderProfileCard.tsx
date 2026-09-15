import React from 'react';
import { Box, Button, Flex, Icon, Popover, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
    MdOutlineSettings,
    MdOutlineExitToApp,
    MdOutlineDevices,
    MdPerson,
    MdOutlineLock
} from 'react-icons/md';
import { HeaderProfileMenuItem } from './HeaderProfileMenuItem';

interface HeaderProfileCardProps {
    userName: string;
    userInitial: string;
    onOpenSettings: () => void;
    onOpenChangePassword: () => void;
    onOpenTokens: () => void;
    onLogout: () => void;
}

export const HeaderProfileCard: React.FC<HeaderProfileCardProps> = ({
    userName,
    userInitial,
    onOpenSettings,
    onOpenChangePassword,
    onOpenTokens,
    onLogout
}) => {
    const { t } = useTranslation();

    return (
        <Popover.Positioner>
            <Popover.Content
                width="320px"
                maxW="90vw"
                backgroundColor="background_secondary"
                borderColor="border_primary"
                borderRadius="2xl"
                boxShadow="0 20px 45px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)"
                p={0}
                overflow="hidden"
                zIndex={1500}
            >
                <Box
                    p={3.5}
                    backgroundColor="background_primary"
                    borderBottom="1px solid"
                    borderColor="border_primary"
                >
                    <Flex align="center" justify="space-between">
                        <Flex align="center" gap={3} overflow="hidden" mr={2}>
                            <Flex
                                w="38px"
                                h="38px"
                                minW="38px"
                                borderRadius="full"
                                backgroundColor="action_primary"
                                color="white"
                                align="center"
                                justify="center"
                                fontSize="md"
                                fontWeight="bold"
                            >
                                {userInitial || <Icon fontSize="20px"><MdPerson /></Icon>}
                            </Flex>

                            <Text
                                fontSize="md"
                                fontWeight="bold"
                                color="text_primary"
                                truncate
                            >
                                {userName}
                            </Text>
                        </Flex>

                        <Button
                            size="xs"
                            variant="ghost"
                            borderRadius="lg"
                            p={1.5}
                            minW="32px"
                            height="32px"
                            color="text_secondary"
                            title={t('header_profile_logout')}
                            aria-label={t('header_profile_logout')}
                            transition="all 0.15s ease"
                            _hover={{
                                backgroundColor: 'status_danger_bg',
                                color: 'status_danger'
                            }}
                            onClick={onLogout}
                        >
                            <Icon fontSize="18px">
                                <MdOutlineExitToApp />
                            </Icon>
                        </Button>
                    </Flex>
                </Box>

                <VStack p={2.5} gap={1.5} align="stretch">
                    <HeaderProfileMenuItem
                        icon={<MdOutlineSettings />}
                        title={t('header_profile_settings')}
                        description={t('header_profile_settings_desc')}
                        onClick={onOpenSettings}
                    />
                    <HeaderProfileMenuItem
                        icon={<MdOutlineLock />}
                        title={t('header_profile_change_password')}
                        description={t('header_profile_change_password_desc')}
                        onClick={onOpenChangePassword}
                    />
                    <HeaderProfileMenuItem
                        icon={<MdOutlineDevices />}
                        title={t('header_profile_tokens')}
                        description={t('header_profile_tokens_desc')}
                        onClick={onOpenTokens}
                    />
                </VStack>
            </Popover.Content>
        </Popover.Positioner>
    );
};
