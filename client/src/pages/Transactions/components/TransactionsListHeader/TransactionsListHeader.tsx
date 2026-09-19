import React from 'react';
import { Button, Flex, HStack, Icon } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdOutlineRefresh } from 'react-icons/md';
import { ViewDisplayMode } from '../TransactionFilterBar/TransactionFilterBar';
import TransactionViewModeSwitcher from '../TransactionViewModeSwitcher/TransactionViewModeSwitcher';

export interface TransactionsListHeaderProps {
    viewDisplayMode: ViewDisplayMode;
    onViewDisplayModeChange: (mode: ViewDisplayMode) => void;
    onRefresh: () => void;
    leftExtra?: React.ReactNode;
    rightExtra?: React.ReactNode;
}

export const TransactionsListHeader: React.FC<TransactionsListHeaderProps> = ({
    viewDisplayMode,
    onViewDisplayModeChange,
    onRefresh,
    leftExtra,
    rightExtra,
}) => {
    const { t } = useTranslation();

    return (
        <Flex
            justify="space-between"
            align="center"
            mb={4}
            flexWrap="wrap"
            gap={3}
            bg="background_primary"
            p={3}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border_primary"
            boxShadow="xs"
        >
            <HStack gap={2}>
                {leftExtra}
                <Button
                    size="sm"
                    variant="outline"
                    borderColor="border_primary"
                    color="text_secondary"
                    onClick={onRefresh}
                    title={t('table_refresh_tooltip')}
                    px={2}
                    borderRadius="lg"
                >
                    <Icon>
                        <MdOutlineRefresh size={18} />
                    </Icon>
                </Button>
            </HStack>

            <HStack gap={3}>
                {rightExtra}
                <TransactionViewModeSwitcher
                    viewDisplayMode={viewDisplayMode}
                    onViewDisplayModeChange={onViewDisplayModeChange}
                />
            </HStack>
        </Flex>
    );
};

export default TransactionsListHeader;
