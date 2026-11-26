import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AccountEntity } from '@/models/accounts/AccountEntity';
import { TransactionTypeEntity } from '@/models/transactions/TransactionTypeEntity';
import BaseSelect from '@/shared/components/BaseSelect/BaseSelect';
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
    selectedTransactionTypeId: string;
    onTransactionTypeFilterChange: (transactionTypeId: string) => void;
    showSystem: boolean;
    onShowSystemChange: (show: boolean) => void;
    accounts: AccountEntity[];
    transactionTypes: TransactionTypeEntity[];
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
    selectedTransactionTypeId,
    onTransactionTypeFilterChange,
    showSystem,
    onShowSystemChange,
    accounts,
    transactionTypes,
    year,
    month,
    onPageSwitched,
}) => {
    const { t } = useTranslation();

    const selectedAccount = React.useMemo(() => {
        return accounts.find((account) => account.id === selectedAccountId) ?? null;
    }, [accounts, selectedAccountId]);

    const selectedTransactionType = React.useMemo(() => {
        return transactionTypes.find((typeItem) => typeItem.id === selectedTransactionTypeId) ?? null;
    }, [transactionTypes, selectedTransactionTypeId]);

    const typeFilterOptions = React.useMemo<{ value: TypeFilterMode; label: string }[]>(() => [
        { value: 'all', label: t('filter_all_types') },
        { value: 'expense', label: t('summary_total_expenses') },
        { value: 'income', label: t('summary_total_income') }
    ], [t]);

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
                <Box w={{ base: '100%', sm: 'auto' }} minW={{ base: 0, sm: '140px' }}>
                    <BaseSelect<{ value: TypeFilterMode; label: string }>
                        size="sm"
                        collection={typeFilterOptions}
                        selectedValue={typeFilter}
                        labelSelector={(option) => option.label}
                        valueSelector={(option) => option.value}
                        isSearchable={false}
                        onSelected={(option) => onTypeFilterChange(option.value)}
                    />
                </Box>

                {/* 4. Account Select Filter with Search */}
                <Box w={{ base: '100%', sm: 'auto' }} minW={{ base: 0, sm: '180px' }} maxW={{ base: 'full', sm: '240px' }}>
                    <BaseSelect<AccountEntity, true>
                        size="sm"
                        placeholder={t('filter_all_accounts')}
                        collection={accounts}
                        selectedValue={selectedAccount}
                        labelSelector={(account) => `${account.name} (${account.currency.name})`}
                        valueSelector={(account) => account.id}
                        isOptionVisible={(account) => account.active}
                        isClearable={true}
                        isSearchable={true}
                        onSelected={(account) => onAccountFilterChange(account?.id ?? '')}
                    />
                </Box>

                {/* 5. Transaction Type Filter with Search */}
                <Box w={{ base: '100%', sm: 'auto' }} minW={{ base: 0, sm: '180px' }} maxW={{ base: 'full', sm: '240px' }}>
                    <BaseSelect<TransactionTypeEntity, true>
                        size="sm"
                        placeholder={t('filter_all_transaction_types')}
                        collection={transactionTypes}
                        selectedValue={selectedTransactionType}
                        labelSelector={(typeItem) => typeItem.name}
                        valueSelector={(typeItem) => typeItem.id}
                        isOptionVisible={(typeItem) => typeItem.active}
                        isClearable={true}
                        isSearchable={true}
                        onSelected={(typeItem) => onTransactionTypeFilterChange(typeItem?.id ?? '')}
                    />
                </Box>

                {/* 6. Show System Switch */}
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
