import React from 'react';
import { Button, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export type TokensTabType = 'active' | 'inactive';

interface TokensTabsProps {
    activeTab: TokensTabType;
    onTabChange: (tab: TokensTabType) => void;
}

export const TokensTabs: React.FC<TokensTabsProps> = ({ activeTab, onTabChange }) => {
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
                backgroundColor={activeTab === 'active' ? 'background_primary' : 'transparent'}
                color={activeTab === 'active' ? 'text_primary' : 'text_secondary'}
                fontWeight={activeTab === 'active' ? 'semibold' : 'normal'}
                onClick={() => onTabChange('active')}
            >
                {t('tokens_tab_active')}
            </Button>
            <Button
                flex={1}
                size="sm"
                borderRadius="lg"
                variant="ghost"
                backgroundColor={activeTab === 'inactive' ? 'background_primary' : 'transparent'}
                color={activeTab === 'inactive' ? 'text_primary' : 'text_secondary'}
                fontWeight={activeTab === 'inactive' ? 'semibold' : 'normal'}
                onClick={() => onTabChange('inactive')}
            >
                {t('tokens_tab_inactive')}
            </Button>
        </Flex>
    );
};
