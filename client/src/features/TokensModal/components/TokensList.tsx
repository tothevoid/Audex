import React from 'react';
import { Box, Flex, Icon, Skeleton, Stack, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdOutlineDevices } from 'react-icons/md';
import { UserRefreshTokenEntity } from '../../../models/auth/UserRefreshTokenEntity';
import { TokenItem } from './TokenItem';
import { TokensTabType } from './TokensTabs';

interface TokensListProps {
    tokens: UserRefreshTokenEntity[];
    loading: boolean;
    activeTab: TokensTabType;
    onRevokeSingle?: (id: string) => Promise<void>;
}

export const TokensList: React.FC<TokensListProps> = ({
    tokens,
    loading,
    activeTab,
    onRevokeSingle
}) => {
    const { t } = useTranslation();

    return (
        <Box
            height="380px"
            minHeight="380px"
            maxHeight="380px"
            overflowY="auto"
            pr={1}
        >
            {tokens.length === 0 && loading ? (
                <Stack gap={2}>
                    <Skeleton height="62px" borderRadius="xl" />
                    <Skeleton height="62px" borderRadius="xl" />
                    <Skeleton height="62px" borderRadius="xl" />
                    <Skeleton height="62px" borderRadius="xl" />
                    <Skeleton height="62px" borderRadius="xl" />
                </Stack>
            ) : tokens.length === 0 ? (
                <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    height="100%"
                    color="text_secondary"
                    gap={2}
                >
                    <Icon fontSize="36px" opacity={0.4}>
                        <MdOutlineDevices />
                    </Icon>
                    <Text fontSize="sm">
                        {activeTab === 'active'
                            ? t('tokens_empty_active')
                            : t('tokens_empty_inactive')}
                    </Text>
                </Flex>
            ) : (
                <VStack
                    gap={2}
                    align="stretch"
                    opacity={loading ? 0.4 : 1}
                    pointerEvents={loading ? 'none' : 'auto'}
                    transition="opacity 0.18s ease-in-out"
                >
                    {tokens.map(token => (
                        <TokenItem
                            key={token.id}
                            token={token}
                            onRevoke={activeTab === 'active' ? onRevokeSingle : undefined}
                        />
                    ))}
                </VStack>
            )}
        </Box>
    );
};
