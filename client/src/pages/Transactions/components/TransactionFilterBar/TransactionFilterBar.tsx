import React from 'react';
import { Box, Flex, Icon, NativeSelect, Checkbox, SegmentGroup } from '@chakra-ui/react';
import { MdViewAgenda, MdTableChart } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import { FilterBar, FilterBarSearch } from '../../../../shared/components/FilterBar';

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
    viewDisplayMode: ViewDisplayMode;
    onViewDisplayModeChange: (mode: ViewDisplayMode) => void;
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
    viewDisplayMode,
    onViewDisplayModeChange,
}) => {
    const { t } = useTranslation();

    return (
        <FilterBar>
            {/* Display View Mode Switcher: Cards vs Table */}
            <SegmentGroup.Root
                size="sm"
                value={viewDisplayMode}
                onValueChange={(e) => onViewDisplayModeChange((e.value as ViewDisplayMode) || 'cards')}
            >
                <SegmentGroup.Indicator />
                <SegmentGroup.Item value="cards">
                    <Icon mr={1} size="xs">
                        <MdViewAgenda />
                    </Icon>
                    <SegmentGroup.ItemText>{t('view_mode_cards')}</SegmentGroup.ItemText>
                    <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
                <SegmentGroup.Item value="table">
                    <Icon mr={1} size="xs">
                        <MdTableChart />
                    </Icon>
                    <SegmentGroup.ItemText>{t('view_mode_table')}</SegmentGroup.ItemText>
                    <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
            </SegmentGroup.Root>

            {/* Search Input */}
            <FilterBarSearch
                searchText={searchQuery}
                onSearchTextChanged={onSearchChange}
                placeholder={t('filter_search_placeholder')}
            />

            <Flex gap={3} flexWrap="wrap" align="center">
                {/* Type Filter Buttons / Segment */}
                <SegmentGroup.Root
                    size="sm"
                    value={typeFilter}
                    onValueChange={(e) => onTypeFilterChange((e.value as TypeFilterMode) || 'all')}
                >
                    <SegmentGroup.Indicator />
                    <SegmentGroup.Item value="all">
                        <SegmentGroup.ItemText>{t('filter_all_types')}</SegmentGroup.ItemText>
                        <SegmentGroup.ItemHiddenInput />
                    </SegmentGroup.Item>
                    <SegmentGroup.Item value="income">
                        <SegmentGroup.ItemText>{t('filter_income_only')}</SegmentGroup.ItemText>
                        <SegmentGroup.ItemHiddenInput />
                    </SegmentGroup.Item>
                    <SegmentGroup.Item value="expense">
                        <SegmentGroup.ItemText>{t('filter_expense_only')}</SegmentGroup.ItemText>
                        <SegmentGroup.ItemHiddenInput />
                    </SegmentGroup.Item>
                </SegmentGroup.Root>

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

                {/* Show System Checkbox */}
                <Checkbox.Root
                    checked={showSystem}
                    onCheckedChange={(details) => onShowSystemChange(!!details.checked)}
                    size="sm"
                >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label color="text_primary" fontSize="xs">
                        {t('manager_transactions_show_system')}
                    </Checkbox.Label>
                </Checkbox.Root>
            </Flex>
        </FilterBar>
    );
};

export default TransactionFilterBar;
