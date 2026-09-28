import React from 'react';
import { Button, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

interface TokensTabsProps {
    isOnlyActive: boolean;
    onTabChange: (isOnlyActive: boolean) => void;
}

export const TokensTabs: React.FC<TokensTabsProps> = ({ isOnlyActive, onTabChange }) => {
    const { t } = useTranslation();

    return (
        <Flex
            p={1}
            borderRadius="xl"
            backgroundColor="background_secondary"
            borderColor="border_primary"
            borderWidth="1px"
            mb={3}
            gap={1}
        >
            <Button
                flex={1}
                size="sm"
                borderRadius="lg"
                variant="ghost"
                backgroundColor={isOnlyActive ? 'background_primary' : 'transparent'}
                color={isOnlyActive ? 'text_primary' : 'text_secondary'}
                fontWeight={isOnlyActive ? 'semibold' : 'normal'}
                onClick={() => onTabChange(true)}
            >
                {t('tokens_tab_active')}
            </Button>
            <Button
                flex={1}
                size="sm"
                borderRadius="lg"
                variant="ghost"
                backgroundColor={!isOnlyActive ? 'background_primary' : 'transparent'}
                color={!isOnlyActive ? 'text_primary' : 'text_secondary'}
                fontWeight={!isOnlyActive ? 'semibold' : 'normal'}
                onClick={() => onTabChange(false)}
            >
                {t('tokens_tab_inactive')}
            </Button>
        </Flex>
    );
};
