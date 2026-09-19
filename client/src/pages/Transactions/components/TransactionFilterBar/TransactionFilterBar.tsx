import React from 'react';
import { Box, Button, Flex, HStack, NativeSelect } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import { FilterBarSearch } from '../../../../shared/components/FilterBar';
import MonthPicker from '../MonthPicker/MonthPicker';
import SwitchButton from '../../../../shared/components/SwitchButton/SwitchButton';

export type TypeFilterMode = 'all' | 'income' | 'expense';
export type ViewDisplayMode = 'cards' | 'table';

interface Props {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    typeFilter: TypeFilterMode;
    onTypeFilterChange: (mode: TypeFilterMode) => void;
    selectedAccountId: string;
    onAccountFilterChange: (accountId: string) => void;
    showSystem: boolean;
    onShowSystemChange: (show: boolean) => void;
    accounts: AccountEntity[];
    year: number;
    month: number;
    onPageSwitched: (month: number, year: number) => void;
}

export const TransactionFilterBar: React.FC<Props> = ({
    searchQuery,
    onSearchChange,
    typeFilter,
    onTypeFilterChange,
    selectedAccountId,
    onAccountFilterChange,
    showSystem,
    onShowSystemChange,
    accounts,
    year,
    month,
    onPageSwitched,
}) => {
    const { t } = useTranslation();

    return (
        <Box
            backgroundColor="background_primary"
            borderColor="border_primary"
            borderWidth="1px"
            borderRadius="xl"
            p={3}
            boxShadow="xs"
            mb={4}
        >
            {/* Row 1: Date Navigation (Standalone) */}
            <Flex align="center" gap={3} pb={3}>
                <MonthPicker year={year} month={month} onPageSwitched={onPageSwitched} />
            </Flex>

            {/* Row 2: Search & All Other Filters (aligned together) */}
            <Flex
                align="center"
                gap={3}
                flexWrap="wrap"
                pt={3}
                borderTopWidth="1px"
                borderColor="border_primary"
            >
                {/* Search Input */}
                <FilterBarSearch
                    searchText={searchQuery}
                    onSearchTextChanged={onSearchChange}
                    placeholder={t('filter_search_placeholder')}
                    maxW={{ base: 'full', sm: '260px', md: '280px' }}
                />

                {/* Type Filter Buttons: Expenses / Income (Toggleable, default all when unselected) */}
                <HStack gap={1.5}>
                    <Button
                        size="sm"
                        variant={typeFilter === 'expense' ? 'solid' : 'outline'}
                        colorPalette={typeFilter === 'expense' ? 'red' : undefined}
                        borderColor={typeFilter === 'expense' ? undefined : 'border_primary'}
                        color={typeFilter === 'expense' ? undefined : 'text_secondary'}
                        onClick={() => onTypeFilterChange(typeFilter === 'expense' ? 'all' : 'expense')}
                    >
                        {t('summary_total_expenses')}
                    </Button>
                    <Button
                        size="sm"
                        variant={typeFilter === 'income' ? 'solid' : 'outline'}
                        colorPalette={typeFilter === 'income' ? 'green' : undefined}
                        borderColor={typeFilter === 'income' ? undefined : 'border_primary'}
                        color={typeFilter === 'income' ? undefined : 'text_secondary'}
                        onClick={() => onTypeFilterChange(typeFilter === 'income' ? 'all' : 'income')}
                    >
                        {t('summary_total_income')}
                    </Button>
                </HStack>

                {/* Account Select Filter */}
                <Box minW="150px">
                    <NativeSelect.Root size="sm">
                        <NativeSelect.Field
                            value={selectedAccountId}
                            onChange={(e) => onAccountFilterChange(e.target.value)}
                            backgroundColor="background_primary"
                            borderColor="border_primary"
                            color="text_primary"
                        >
                            <option value="">{t('filter_all_accounts')}</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name}
                                </option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </Box>

                {/* Show System Switch */}
                <SwitchButton
                    active={showSystem}
                    onSwitch={onShowSystemChange}
                    title={t('manager_transactions_show_system')}
                    size="sm"
                />
            </Flex>
        </Box>
    );
};

export default TransactionFilterBar;
