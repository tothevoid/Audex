import React, { useCallback, useMemo } from 'react';
import { Box, Flex, Grid, GridItem, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { TransactionEntity } from '@/models/transactions/TransactionEntity';
import { AccountEntity } from '@/models/accounts/AccountEntity';
import { TypeFilterMode } from '@/pages/Transactions/components/TransactionFilterBar/TransactionFilterBar';
import Transaction from '@/pages/Transactions/components/Transaction/Transaction';
import TransactionStats from '@/pages/Transactions/components/TransactionStats/TransactionStats';
import { formatDate } from '@/shared/utilities/formatters/dateFormatter';
import { formatMoneyByCurrencyCulture } from '@/shared/utilities/formatters/moneyFormatter';
import { groupByKey, sumEntities } from '@/shared/utilities/arrayUtilities';
import { getMonthByIndex } from '@/shared/utilities/dateUtils';
import { useUserProfile } from '@/features/UserProfileSettingsModal/hooks/UserProfileContext';

export interface TransactionCardsViewProps {
    transactions: TransactionEntity[];
    statsTransactions: TransactionEntity[];
    accounts: AccountEntity[];
    isLoading: boolean;
    year: number;
    month?: number | null;
    typeFilter: TypeFilterMode;
    selectedCategoryId?: string;
    onCategoryClick?: (categoryId: string) => void;
    selectedAccountId?: string;
    onAccountClick?: (accountId: string) => void;
    onEditClicked: (transaction: TransactionEntity) => void;
    onDeleteClicked: (transaction: TransactionEntity) => void;
    onDuplicateClicked: (transaction: TransactionEntity) => void;
}

const TransactionCardsView: React.FC<TransactionCardsViewProps> = ({
    transactions,
    statsTransactions,
    accounts,
    isLoading,
    year,
    month,
    typeFilter,
    selectedCategoryId,
    onCategoryClick,
    selectedAccountId,
    onAccountClick,
    onEditClicked,
    onDeleteClicked,
    onDuplicateClicked,
}) => {
    const { t, i18n } = useTranslation();
    const { user } = useUserProfile();

    const isYearMode = month === null || month === undefined;

    const groupedTransactions = useMemo(() => {
        return groupByKey(transactions, (transaction) => {
            const transactionDate = new Date(transaction.date);
            if (isYearMode) {
                return (transactionDate.getMonth() + 1).toString();
            }
            return transactionDate.getDate().toString();
        });
    }, [transactions, isYearMode]);

    const calculateSummary = useCallback((groupTransactions: TransactionEntity[]) => {
        const sum = sumEntities(groupTransactions, (transactionItem) => transactionItem.amount * (transactionItem.account.currency.rate || 1));
        return formatMoneyByCurrencyCulture(sum, user?.currency.name);
    }, [user?.currency.name]);

    const getGroupHeaderTitle = useCallback((groupKey: string, groupTransactions: TransactionEntity[]): string => {
        if (isYearMode) {
            return `${getMonthByIndex(Number(groupKey), i18n)} ${year}`;
        }

        return formatDate(new Date(groupTransactions[0].date), i18n, false);
    }, [isYearMode, i18n, year]);

    return (
        <Grid templateColumns={{ base: '1fr', lg: '7fr 5fr' }} gap={8}>
            {/* Grouped Daily Transactions Column */}
            <GridItem>
                <Box>
                    {isLoading && (
                        <VStack gap={3} my={4}>
                            <Skeleton height="60px" borderRadius="xl" width="100%" />
                            <Skeleton height="60px" borderRadius="xl" width="100%" />
                            <Skeleton height="60px" borderRadius="xl" width="100%" />
                            <Skeleton height="60px" borderRadius="xl" width="100%" />
                        </VStack>
                    )}

                    {!isLoading &&
                        [...groupedTransactions.entries()].map(([groupKey, groupTransactions]) => (
                            <Box key={groupKey} mb={6}>
                                <Flex
                                    justify="space-between"
                                    align="center"
                                    pb={2}
                                    mb={2}
                                    borderColor="border_primary"
                                    borderBottomWidth="1px"
                                >
                                    <Text fontWeight={600} fontSize={isYearMode ? 'sm' : 'xs'} color="text_secondary">
                                        {getGroupHeaderTitle(groupKey, groupTransactions)}
                                    </Text>
                                    <Text fontWeight={600} fontSize={isYearMode ? 'sm' : 'xs'} color="text_secondary">
                                        {calculateSummary(groupTransactions)}
                                    </Text>
                                </Flex>

                                {groupTransactions.map((transaction: TransactionEntity) => (
                                    <Transaction
                                        key={transaction.id}
                                        transaction={transaction}
                                        onUpdateClicked={onEditClicked}
                                        onDeleteClicked={onDeleteClicked}
                                        onDuplicateClicked={onDuplicateClicked}
                                        accounts={accounts}
                                    />
                                ))}
                            </Box>
                        ))}

                    {!isLoading && !transactions.length && (
                        <Box
                            p={8}
                            textAlign="center"
                            borderRadius="xl"
                            backgroundColor="background_primary"
                            borderColor="border_primary"
                            borderWidth="1px"
                        >
                            <Text fontSize="md" color="text_secondary" fontWeight={500}>
                                {t('manager_transactions_empty')}
                            </Text>
                        </Box>
                    )}
                </Box>
            </GridItem>

            {/* Donut Analytics Sidebar */}
            <GridItem>
                <TransactionStats
                    accounts={accounts}
                    transactions={statsTransactions}
                    typeFilter={typeFilter}
                    selectedCategoryId={selectedCategoryId}
                    onCategoryClick={onCategoryClick}
                    selectedAccountId={selectedAccountId}
                    onAccountClick={onAccountClick}
                />
            </GridItem>
        </Grid>
    );
};

export default TransactionCardsView;
