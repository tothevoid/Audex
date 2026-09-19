import React from 'react';
import { Button, HStack, Icon } from '@chakra-ui/react';
import { MdViewAgenda, MdTableChart } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { ViewDisplayMode } from '../TransactionFilterBar/TransactionFilterBar';

interface Props {
    viewDisplayMode: ViewDisplayMode;
    onViewDisplayModeChange: (mode: ViewDisplayMode) => void;
}

export const TransactionViewModeSwitcher: React.FC<Props> = ({
    viewDisplayMode,
    onViewDisplayModeChange,
}) => {
    const { t } = useTranslation();

    return (
        <HStack gap={1.5}>
            <Button
                size="sm"
                variant={viewDisplayMode === 'cards' ? 'solid' : 'outline'}
                onClick={() => onViewDisplayModeChange('cards')}
            >
                <Icon mr={1} size="xs">
                    <MdViewAgenda />
                </Icon>
                {t('view_mode_cards')}
            </Button>
            <Button
                size="sm"
                variant={viewDisplayMode === 'table' ? 'solid' : 'outline'}
                onClick={() => onViewDisplayModeChange('table')}
            >
                <Icon mr={1} size="xs">
                    <MdTableChart />
                </Icon>
                {t('view_mode_table')}
            </Button>
        </HStack>
    );
};

export default TransactionViewModeSwitcher;

