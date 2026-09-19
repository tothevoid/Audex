import React from 'react';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import { MdOutlinePayment } from 'react-icons/md';
import { Flex, Text, Badge, Box } from '@chakra-ui/react';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { TransactionEntity } from '../../../../models/transactions/TransactionEntity';
import { getTransactionTypeIconUrl } from '../../../../api/transactions/transactionTypeApi';
import StoredIcon from '../../../../shared/components/StoredIcon';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';
import EntityCard from '../../../../shared/components/EntityCard/EntityCard';
import { useUserProfile } from '../../../../features/UserProfileSettingsModal/hooks/UserProfileContext';

interface Props {
    transaction: TransactionEntity;
    accounts: AccountEntity[];
    onUpdateClicked: (updatedTransaction: TransactionEntity) => void;
    onDeleteClicked: (transaction: TransactionEntity) => void;
    onDuplicateClicked?: (transaction: TransactionEntity) => void;
}

const Transaction: React.FC<Props> = ({
    transaction,
    onUpdateClicked,
    onDeleteClicked,
    onDuplicateClicked,
}) => {
    const { amount, transactionType, name, account } = transaction;
    const { user } = useUserProfile();
    const isIncome = amount > 0;
    const iconUrl = transactionType?.iconKey ? getTransactionTypeIconUrl(transactionType.iconKey) : undefined;

    // Currency conversion check if account currency differs from user's primary currency
    const userCurrencyName = user?.currency?.name;
    const isDifferentCurrency = userCurrencyName && account.currency.name !== userCurrencyName;
    const convertedAmount = isDifferentCurrency
        ? amount * (account.currency.rate || 1)
        : null;

    return (
        <EntityCard p={3} my={2}>
            <Flex justifyContent="space-between" alignItems="center" gap={3}>
                <Flex alignItems="center" gap={3} flex={1} minW={0}>
                    <Flex
                        w={10}
                        h={10}
                        minW={10}
                        borderRadius="xl"
                        align="center"
                        justify="center"
                        backgroundColor={isIncome ? 'status_success_bg' : 'status_danger_bg'}
                    >
                        <StoredIcon
                            src={iconUrl}
                            fallbackIcon={
                                <MdOutlinePayment
                                    size={20}
                                    color={isIncome ? 'var(--chakra-colors-gain)' : 'var(--chakra-colors-loss)'}
                                />
                            }
                            size="sm"
                        />
                    </Flex>

                    <Box flex={1} minW={0}>
                        <Flex align="center" gap={2.5} flexWrap="wrap">
                            <Text fontWeight={600} fontSize="sm" color="text_primary" truncate>
                                {name || transactionType?.name}
                            </Text>

                            {/* Amount placed directly to the right of Name */}
                            <Flex align="baseline" gap={1.5}>
                                <Text
                                    fontWeight={700}
                                    fontSize="sm"
                                    color={isIncome ? 'gain' : 'loss'}
                                    whiteSpace="nowrap"
                                >
                                    {isIncome ? '+' : ''}
                                    {formatMoneyByCurrencyCulture(amount, account.currency.name)}
                                </Text>

                                {convertedAmount !== null && (
                                    <Text fontSize="2xs" color="text_secondary" whiteSpace="nowrap">
                                        (≈ {formatMoneyByCurrencyCulture(convertedAmount, userCurrencyName)})
                                    </Text>
                                )}
                            </Flex>

                            {/* Clean Account Badge without redundant currency text */}
                            <Badge
                                size="xs"
                                variant="subtle"
                                backgroundColor="background_secondary"
                                color="text_secondary"
                                borderRadius="md"
                            >
                                {account.name}
                            </Badge>
                        </Flex>

                        {transactionType?.name && (
                            <Text fontSize="2xs" color="text_secondary" mt={0.5}>
                                {transactionType.name}
                            </Text>
                        )}
                    </Box>
                </Flex>

                {/* Right side: Action buttons (Copy into bar, Edit, Delete) */}
                <CardActionButtons
                    size="xs"
                    onCopy={onDuplicateClicked ? () => onDuplicateClicked(transaction) : undefined}
                    onEdit={() => onUpdateClicked(transaction)}
                    onDelete={() => onDeleteClicked(transaction)}
                />
            </Flex>
        </EntityCard>
    );
};

export default Transaction;