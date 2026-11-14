import React from 'react';
import { Box, Flex, NativeSelect } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AccountEntity } from '@/models/accounts/AccountEntity';
import { FilterBarSearch } from '@/shared/components/FilterBar';
import PeriodPicker from '@/pages/Transactions/components/PeriodPicker/PeriodPicker';
import SwitchButton from '@/shared/components/SwitchButton/SwitchButton';

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
    month?: number | null;
    onPageSwitched: (month: number | null, year: number) => void;
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
            <Flex
                align="center"
                gap={3}
                flexWrap="wrap"
            >
                {/* 1. Date Navigation */}
                <PeriodPicker year={year} month={month} onPeriodChange={onPageSwitched} />

                {/* 2. Search Input */}
                <FilterBarSearch
                    searchText={searchQuery}
                    onSearchTextChanged={onSearchChange}
                    placeholder={t('filter_search_placeholder')}
                    maxW={{ base: 'full', sm: '220px', md: '260px' }}
                />

                {/* 3. Operation Type Select (All / Income / Expense) */}
                <Box minW="140px">
                    <NativeSelect.Root size="sm">
                        <NativeSelect.Field
                            value={typeFilter}
                            onChange={(event) => onTypeFilterChange(event.target.value as TypeFilterMode)}
                            backgroundColor="background_primary"
                            borderColor="border_primary"
                            color="text_primary"
                        >
                            <option value="all">{t('filter_all_types')}</option>
                            <option value="expense">{t('summary_total_expenses')}</option>
                            <option value="income">{t('summary_total_income')}</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </Box>

                {/* 4. Account Select Filter */}
                <Box minW="150px">
                    <NativeSelect.Root size="sm">
                        <NativeSelect.Field
                            value={selectedAccountId}
                            onChange={(event) => onAccountFilterChange(event.target.value)}
                            backgroundColor="background_primary"
                            borderColor="border_primary"
                            color="text_primary"
                        >
                            <option value="">{t('filter_all_accounts')}</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
                                </option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </Box>

                {/* 5. Show System Switch */}
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
