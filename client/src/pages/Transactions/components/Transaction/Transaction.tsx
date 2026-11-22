import React from 'react';
import { AccountEntity } from '@/models/accounts/AccountEntity';
import { MdOutlinePayment } from 'react-icons/md';
import { Badge, Box, Flex, HStack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { formatMoneyByCurrencyCulture } from '@/shared/utilities/formatters/moneyFormatter';
import { TransactionEntity } from '@/models/transactions/TransactionEntity';
import { getTransactionTypeIconUrl } from '@/api/transactions/transactionTypeApi';
import StoredIcon from '@/shared/components/StoredIcon';
import CardActionButtons from '@/shared/components/CardActionButtons/CardActionButtons';
import EntityCard from '@/shared/components/EntityCard/EntityCard';
import { useUserProfile } from '@/features/UserProfileSettingsModal/hooks/UserProfileContext';

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
    const { amount, cashback, transactionType, name, account } = transaction;
    const { user } = useUserProfile();
    const { t } = useTranslation();
    const isIncome = amount > 0;
    const iconUrl = transactionType.iconKey ? getTransactionTypeIconUrl(transactionType.iconKey) : undefined;

    const userCurrencyName = user.currency.name;
    const isDifferentCurrency = account.currency.name !== userCurrencyName;
    const convertedAmount = isDifferentCurrency
        ? amount * account.currency.rate
        : null;

    const hasCashback = cashback > 0;
    const displayName = name || transactionType.name;
    const showCategorySubtitle = Boolean(name && name !== transactionType.name);

    return (
        <EntityCard p={2.5} my={1.5}>
            <Flex justifyContent="space-between" alignItems="center" gap={3}>
                {/* Left section: Icon + Title & Category/Account metadata */}
                <Flex alignItems="center" gap={3} flex={1} minW={0}>
                    <Flex
                        w={9}
                        h={9}
                        minW={9}
                        borderRadius="lg"
                        align="center"
                        justify="center"
                        backgroundColor={isIncome ? 'status_success_bg' : 'status_danger_bg'}
                        flexShrink={0}
                    >
                        <StoredIcon
                            src={iconUrl}
                            fallbackIcon={
                                <MdOutlinePayment
                                    size={18}
                                    color={isIncome ? 'var(--chakra-colors-gain)' : 'var(--chakra-colors-loss)'}
                                />
                            }
                            size="sm"
                        />
                    </Flex>

                    <Box flex={1} minW={0}>
                        {/* Primary title: Transaction Name */}
                        <Text
                            fontWeight={600}
                            fontSize="sm"
                            color="text_primary"
                            truncate
                            title={displayName}
                        >
                            {displayName}
                        </Text>

                        {/* Metadata row: Category, Account Badge */}
                        <HStack gap={2} mt={0.5} flexWrap="wrap" align="center">
                            {showCategorySubtitle && (
                                <Text fontSize="xs" color="text_secondary" truncate>
                                    {transactionType.name}
                                </Text>
                            )}

                            <Badge
                                size="xs"
                                variant="subtle"
                                backgroundColor="background_secondary"
                                color="text_secondary"
                                borderRadius="md"
                            >
                                {account.name}
                            </Badge>
                        </HStack>
                    </Box>
                </Flex>

                {/* Right section: Amount with inline conversion, Cashback subtitle + CardActionButtons */}
                <HStack gap={3} flexShrink={0} align="center">
                    <Box textAlign="right">
                        <Flex justify="flex-end" align="baseline" gap={1.5} whiteSpace="nowrap">
                            <Text
                                fontWeight={700}
                                fontSize="sm"
                                color={isIncome ? 'gain' : 'loss'}
                            >
                                {isIncome ? '+' : ''}
                                {formatMoneyByCurrencyCulture(amount, account.currency.name)}
                            </Text>

                            {convertedAmount !== null && (
                                <Text fontSize="2xs" color="text_secondary">
                                    (≈ {formatMoneyByCurrencyCulture(convertedAmount, userCurrencyName)})
                                </Text>
                            )}
                        </Flex>

                        {hasCashback && (
                            <Text color="gain" fontSize="2xs" fontWeight={600} whiteSpace="nowrap">
                                +{formatMoneyByCurrencyCulture(cashback, account.currency.name)} {t('entity_transaction_cashback').toLowerCase()}
                            </Text>
                        )}
                    </Box>

                    <CardActionButtons
                        size="xs"
                        onCopy={onDuplicateClicked ? () => onDuplicateClicked(transaction) : undefined}
                        onEdit={() => onUpdateClicked(transaction)}
                        onDelete={() => onDeleteClicked(transaction)}
                    />
                </HStack>
            </Flex>
        </EntityCard>
    );
};

export default Transaction;