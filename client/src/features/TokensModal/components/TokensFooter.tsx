import React from 'react';
import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdOutlineExitToApp } from 'react-icons/md';

interface TokensFooterProps {
    hasOtherActiveTokens: boolean;
    isRevokingAll: boolean;
    onRevokeAllOthers: () => Promise<void>;
    onClose: () => void;
}

export const TokensFooter: React.FC<TokensFooterProps> = ({
    hasOtherActiveTokens,
    isRevokingAll,
    onRevokeAllOthers,
    onClose
}) => {
    const { t } = useTranslation();

    return (
        <Flex justifyContent="space-between" alignItems="center" width="100%">
            <Box>
                {hasOtherActiveTokens && (
                    <Button
                        size="sm"
                        variant="outline"
                        borderRadius="xl"
                        borderColor="status_danger_border"
                        backgroundColor="status_danger_bg"
                        color="status_danger"
                        _hover={{
                            backgroundColor: 'status_danger_bg',
                            borderColor: 'card_action_icon_danger',
                            color: 'card_action_icon_danger'
                        }}
                        loading={isRevokingAll}
                        onClick={onRevokeAllOthers}
                        display="flex"
                        alignItems="center"
                        gap={1.5}
                    >
                        <Icon fontSize="16px">
                            <MdOutlineExitToApp />
                        </Icon>
                        <Text fontSize="xs" fontWeight="semibold">
                            {t('tokens_terminate_all_others')}
                        </Text>
                    </Button>
                )}
            </Box>

            <Button
                size="sm"
                variant="outline"
                borderRadius="xl"
                borderColor="border_primary"
                color="text_primary"
                _hover={{ backgroundColor: 'background_secondary' }}
                onClick={onClose}
            >
                {t('modals_cancel_button')}
            </Button>
        </Flex>
    );
};
