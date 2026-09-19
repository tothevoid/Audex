import React, { useMemo } from 'react';
import { Box, Flex, Grid, GridItem, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { TransactionEntity } from '../../../../models/transactions/TransactionEntity';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import { TypeFilterMode } from '../TransactionFilterBar/TransactionFilterBar';
import Transaction from '../Transaction/Transaction';
import TransactionStats from '../TransactionStats/TransactionStats';
import { formatDate } from '../../../../shared/utilities/formatters/dateFormatter';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { groupByKey, sumEntities } from '../../../../shared/utilities/arrayUtilities';
import { useUserProfile } from '../../../../features/UserProfileSettingsModal/hooks/UserProfileContext';

export interface TransactionCardsViewProps {
    transactions: TransactionEntity[];
    statsTransactions: TransactionEntity[];
    accounts: AccountEntity[];
    isLoading: boolean;
    year: number;
    month: number;
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

    const groupedTransactions = useMemo(() => {
        return groupByKey(transactions, (transaction) => transaction.date.getDate());
    }, [transactions]);

    const calculateSummary = (dayTransactions: TransactionEntity[]) => {
        const sum = sumEntities(dayTransactions, (t) => t.amount * (t.account.currency.rate || 1));
        return formatMoneyByCurrencyCulture(sum, user?.currency.name);
    };

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
                        [...groupedTransactions.entries()].map(([transactionDay, dayTransactions]) => (
                            <Box key={transactionDay} mb={6}>
                                <Flex
                                    justify="space-between"
                                    align="center"
                                    pb={2}
                                    mb={2}
                                    borderColor="border_primary"
                                    borderBottomWidth="1px"
                                >
                                    <Text fontWeight={600} fontSize="xs" color="text_secondary">
                                        {formatDate(new Date(year, month - 1, transactionDay), i18n, false)}
                                    </Text>
                                    <Text fontWeight={600} fontSize="xs" color="text_secondary">
                                        {calculateSummary(dayTransactions)}
                                    </Text>
                                </Flex>

                                {dayTransactions.map((transaction: TransactionEntity) => (
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
