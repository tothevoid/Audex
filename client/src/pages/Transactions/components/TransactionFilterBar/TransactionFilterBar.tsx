import React from 'react';
import { Box, Flex, NativeSelect } from '@chakra-ui/react';
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

                {/* 4. Account Select Filter with Search */}
                <Box minW="180px" maxW="240px">
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
                <Box minW="180px" maxW="240px">
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
