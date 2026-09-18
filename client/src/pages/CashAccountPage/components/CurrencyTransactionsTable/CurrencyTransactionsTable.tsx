import React from "react";
import { Box, Button, HStack, Icon, Table, Text, Badge } from "@chakra-ui/react";
import { MdEdit, MdDelete, MdArrowForward } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { formatMoneyByCurrencyCulture } from "../../../../shared/utilities/formatters/moneyFormatter";
import { formatNumericDate } from "../../../../shared/utilities/formatters/dateFormatter";
import { calculateDiff } from "../../../../shared/utilities/numericDiffsUtilities";
import { CurrencyTransactionEntity } from "../../../../models/transactions/CurrencyTransactionEntity";
import { UserProfileEntity } from "../../../../models/user/UserProfileEntity";

interface CurrencyTransactionsTableProps {
    transactions: CurrencyTransactionEntity[];
    currenciesMap: Record<string, number>;
    user?: UserProfileEntity | null;
    onEdit: (transaction: CurrencyTransactionEntity) => void;
    onDelete: (transaction: CurrencyTransactionEntity) => void;
}

export const CurrencyTransactionsTable: React.FC<CurrencyTransactionsTableProps> = ({
    transactions,
    currenciesMap,
    user,
    onEdit,
    onDelete,
}) => {
    const { t, i18n } = useTranslation();

    return (
        <Box backgroundColor="background_primary" borderRadius="xl" borderWidth="1px" borderColor="border_primary" overflow="hidden">
            <Table.Root size="md" variant="line">
                <Table.Header backgroundColor="background_secondary">
                    <Table.Row>
                        <Table.ColumnHeader color="text_secondary">{t("entity_currency_transaction_date")}</Table.ColumnHeader>
                        <Table.ColumnHeader color="text_secondary">{t("currency_transactions_route")}</Table.ColumnHeader>
                        <Table.ColumnHeader color="text_secondary" textAlign="right">{t("currency_transactions_rates")}</Table.ColumnHeader>
                        <Table.ColumnHeader color="text_secondary" textAlign="right">{t("currency_transactions_diff")}</Table.ColumnHeader>
                        <Table.ColumnHeader width="90px" textAlign="right"></Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {transactions.map((tr) => {
                        const currentRate = currenciesMap[tr.destinationAccount.currency.id] ?? 0;
                        const spentAmount = tr.amount * tr.rate;
                        const diff = calculateDiff(
                            currentRate * tr.amount,
                            tr.rate * tr.amount,
                            tr.sourceAccount.currency.name
                        );
                        const rateDiffPct = tr.rate > 0 ? ((currentRate - tr.rate) / tr.rate) * 100 : 0;
                        const isPositive = diff.rawProfitAndLoss >= 0;

                        return (
                            <Table.Row key={tr.id} _hover={{ backgroundColor: "background_secondary" }}>
                                <Table.Cell>
                                    <Text fontWeight="600" color="text_primary">
                                        {formatNumericDate(tr.date, i18n)}
                                    </Text>
                                    {tr.name?.trim() && (
                                        <Text fontSize="xs" color="text_secondary">
                                            {tr.name}
                                        </Text>
                                    )}
                                </Table.Cell>

                                {/* Route & Amounts */}
                                <Table.Cell>
                                    {/* Line 1: Accounts with Currency Badges */}
                                    <HStack gap={2} align="center">
                                        <Text fontWeight="600" color="text_primary">
                                            {tr.sourceAccount.name}
                                        </Text>
                                        <Badge size="xs" variant="surface" colorPalette="gray">
                                            {tr.sourceAccount.currency.name}
                                        </Badge>
                                        <Icon color="text_secondary" fontSize="xs">
                                            <MdArrowForward />
                                        </Icon>
                                        <Text fontWeight="700" color="text_primary">
                                            {tr.destinationAccount.name}
                                        </Text>
                                        <Badge size="xs" variant="solid" colorPalette="green">
                                            {tr.destinationAccount.currency.name}
                                        </Badge>
                                    </HStack>

                                    {/* Line 2: Amounts without +/- signs */}
                                    <HStack gap={2} align="center" mt={1}>
                                        <Text color="text_secondary" fontSize="xs">
                                            {formatMoneyByCurrencyCulture(spentAmount, tr.sourceAccount.currency.name)}
                                        </Text>
                                        <Icon color="text_secondary" fontSize="10px">
                                            <MdArrowForward />
                                        </Icon>
                                        <Text color="pnl_positive" fontWeight="700" fontSize="sm">
                                            {formatMoneyByCurrencyCulture(tr.amount, tr.destinationAccount.currency.name)}
                                        </Text>
                                    </HStack>
                                </Table.Cell>

                                {/* Rates: Purchase rate & Current Market rate */}
                                <Table.Cell textAlign="right">
                                    <Text fontWeight="700" color="text_primary">
                                        1 {tr.destinationAccount.currency.name} = {formatMoneyByCurrencyCulture(tr.rate, tr.sourceAccount.currency.name)}
                                    </Text>
                                    <Text fontSize="xs" color="text_secondary" mt={0.5}>
                                        {t("currency_transactions_current_rate")}: 1 {tr.destinationAccount.currency.name} = {formatMoneyByCurrencyCulture(currentRate, user?.currency.name ?? tr.sourceAccount.currency.name)}
                                    </Text>
                                </Table.Cell>

                                {/* PnL */}
                                <Table.Cell textAlign="right">
                                    <Text fontWeight="800" fontSize="md" color={diff.color}>
                                        {isPositive ? "+" : ""}{diff.profitAndLoss}
                                    </Text>
                                    <Text fontSize="xs" color={diff.color}>
                                        {rateDiffPct > 0 ? "+" : ""}{rateDiffPct.toFixed(2)}%
                                    </Text>
                                </Table.Cell>

                                {/* Actions */}
                                <Table.Cell textAlign="right">
                                    <HStack gap={1} justify="flex-end">
                                        <Button
                                            size="xs"
                                            variant="subtle"
                                            backgroundColor="background_secondary"
                                            onClick={() => onEdit(tr)}
                                        >
                                            <Icon color="card_action_icon_primary">
                                                <MdEdit />
                                            </Icon>
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="subtle"
                                            backgroundColor="background_secondary"
                                            onClick={() => onDelete(tr)}
                                        >
                                            <Icon color="card_action_icon_danger">
                                                <MdDelete />
                                            </Icon>
                                        </Button>
                                    </HStack>
                                </Table.Cell>
                            </Table.Row>
                        );
                    })}
                </Table.Body>
            </Table.Root>
        </Box>
    );
};
