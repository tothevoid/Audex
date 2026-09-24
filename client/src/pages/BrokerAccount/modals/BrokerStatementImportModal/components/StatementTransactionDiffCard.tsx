import React from "react";
import { Badge, Box, Card, Checkbox, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { i18n as I18nInstance } from "i18next";
import { BsExclamationTriangle } from "react-icons/bs";
import {
    BrokerStatementDiffItemEntity,
    StatementDiscrepancyField
} from "../../../../../models/brokers/BrokerStatementImportModels";
import { Nullable } from "../../../../../shared/utilities/nullable";
import { formatShortDateTime, formatTimeWithSeconds } from "../../../../../shared/utilities/formatters/dateFormatter";

const formatTradeDate = (dateString: string, i18n: I18nInstance): string => {
    if (!dateString) return "";
    return formatShortDateTime(new Date(dateString), i18n, true);
};

const formatDiffDate = (
    databaseDateString: Nullable<string> | undefined,
    statementDateString: string | undefined,
    i18n: I18nInstance
): string => {
    if (!databaseDateString || !statementDateString) return "";

    const databaseDate = new Date(databaseDateString);
    const statementDate = new Date(statementDateString);

    if (databaseDate.toDateString() === statementDate.toDateString()) {
        return `${formatTimeWithSeconds(databaseDate, i18n)} ➔ ${formatTimeWithSeconds(statementDate, i18n)}`;
    }

    return `${formatShortDateTime(databaseDate, i18n, true)} ➔ ${formatShortDateTime(statementDate, i18n, true)}`;
};

interface Props {
    diffItem: BrokerStatementDiffItemEntity;
    isSelected: boolean;
    showCheckbox: boolean;
    onToggleSelect: (diffItemId: string, hasWarning: boolean) => void;
}

export const StatementTransactionDiffCard: React.FC<Props> = ({
    diffItem,
    isSelected,
    showCheckbox,
    onToggleSelect
}) => {
    const { t, i18n } = useTranslation();

    const transaction = diffItem.statementTransaction ?? diffItem.databaseTransaction;
    const isSell = transaction?.isSell ?? false;
    const quantity = transaction?.quantity ?? 0;
    const price = transaction?.price ?? 0;
    const totalVolume = quantity * price;

    const isCheckboxDisabled = diffItem.hasWarning;

    const databaseTransaction = diffItem.databaseTransaction;
    const statementTransaction = diffItem.statementTransaction;
    const hasDiscrepancies =
        Boolean(diffItem.discrepancyFields && diffItem.discrepancyFields.length > 0) &&
        Boolean(databaseTransaction && statementTransaction);

    return (
        <Card.Root
            backgroundColor="background_secondary"
            borderColor={
                diffItem.hasWarning
                    ? "orange.400"
                    : isSelected
                        ? "action_primary"
                        : "border_primary"
            }
            borderWidth="1px"
            borderRadius="md"
            p={3}
        >
            <Flex justifyContent="space-between" alignItems="flex-start" gap={3}>
                <HStack gap={3} alignItems="center">
                    {showCheckbox && (
                        <Checkbox.Root
                            checked={isSelected}
                            disabled={isCheckboxDisabled}
                            onCheckedChange={() => onToggleSelect(diffItem.id, diffItem.hasWarning)}
                        >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                        </Checkbox.Root>
                    )}

                    <Badge
                        colorPalette={isSell ? "red" : "green"}
                        variant="solid"
                        size="sm"
                    >
                        {isSell
                            ? t("broker_statement_deal_sell")
                            : t("broker_statement_deal_buy")}
                    </Badge>

                    <Box>
                        <HStack gap={2} flexWrap="wrap">
                            <Text fontWeight={700} fontSize="sm" color="text_primary">
                                {diffItem.ticker}
                            </Text>
                            {diffItem.isin && (
                                <Text fontSize="xs" color="text_secondary">
                                    ({diffItem.isin})
                                </Text>
                            )}
                            <Text fontSize="xs" color="text_secondary" display={{ base: "none", md: "inline" }}>
                                {diffItem.securityName}
                            </Text>
                            {diffItem.isConsolidated && (
                                <Badge size="xs" variant="subtle" colorPalette="blue">
                                    {t("broker_statement_badge_consolidated", { count: diffItem.consolidatedCount })}
                                </Badge>
                            )}
                        </HStack>
                        <Text fontSize="xs" color="text_secondary">
                            {formatTradeDate(diffItem.tradeDateTime, i18n)}
                        </Text>
                    </Box>
                </HStack>

                <VStack align="flex-end" gap={0.5}>
                    <Text fontWeight={600} fontSize="sm" color="text_primary">
                        {quantity} шт. × {price.toFixed(2)} ₽
                    </Text>
                    <Text fontSize="xs" color="text_secondary">
                        Σ {totalVolume.toFixed(2)} ₽
                    </Text>
                </VStack>
            </Flex>

            {/* Discrepancies Details - Row by Row */}
            {hasDiscrepancies && databaseTransaction && statementTransaction && (
                <VStack mt={2} pt={2} borderTopWidth="1px" borderColor="border_primary" gap={1.5} align="stretch">
                    {diffItem.discrepancyFields?.includes(StatementDiscrepancyField.Price) && (
                        <HStack gap={2} fontSize="xs" alignItems="center">
                            <Text color="text_secondary" minW="130px">
                                {t("broker_statement_diff_price")}:
                            </Text>
                            <Badge size="xs" variant="outline" borderColor="border_primary" color="text_secondary">
                                {databaseTransaction.price.toFixed(2)} ₽ ➔ {statementTransaction.price.toFixed(2)} ₽
                            </Badge>
                        </HStack>
                    )}
                    {diffItem.discrepancyFields?.includes(StatementDiscrepancyField.BrokerCommission) && (
                        <HStack gap={2} fontSize="xs" alignItems="center">
                            <Text color="text_secondary" minW="130px">
                                {t("broker_statement_diff_broker_commission")}:
                            </Text>
                            <Badge size="xs" variant="outline" borderColor="border_primary" color="text_secondary">
                                {databaseTransaction.brokerCommission.toFixed(2)} ₽ ➔ {statementTransaction.brokerCommission.toFixed(2)} ₽
                            </Badge>
                        </HStack>
                    )}
                    {diffItem.discrepancyFields?.includes(StatementDiscrepancyField.StockExchangeCommission) && (
                        <HStack gap={2} fontSize="xs" alignItems="center">
                            <Text color="text_secondary" minW="130px">
                                {t("broker_statement_diff_exchange_commission")}:
                            </Text>
                            <Badge size="xs" variant="outline" borderColor="border_primary" color="text_secondary">
                                {databaseTransaction.stockExchangeCommission.toFixed(2)} ₽ ➔ {statementTransaction.stockExchangeCommission.toFixed(2)} ₽
                            </Badge>
                        </HStack>
                    )}
                    {diffItem.discrepancyFields?.includes(StatementDiscrepancyField.Tax) && (
                        <HStack gap={2} fontSize="xs" alignItems="center">
                            <Text color="text_secondary" minW="130px">
                                {t("broker_statement_diff_tax")}:
                            </Text>
                            <Badge size="xs" variant="outline" borderColor="border_primary" color="text_secondary">
                                {databaseTransaction.tax.toFixed(2)} ₽ ➔ {statementTransaction.tax.toFixed(2)} ₽
                            </Badge>
                        </HStack>
                    )}
                    {diffItem.discrepancyFields?.includes(StatementDiscrepancyField.Date) && (
                        <HStack gap={2} fontSize="xs" alignItems="center">
                            <Text color="text_secondary" minW="130px">
                                {new Date(databaseTransaction.date).toDateString() === new Date(statementTransaction.date).toDateString()
                                    ? t("broker_statement_discrepancy_time")
                                    : t("broker_statement_diff_date")}:
                            </Text>
                            <Badge size="xs" variant="outline" borderColor="border_primary" color="text_secondary">
                                {formatDiffDate(databaseTransaction.date, statementTransaction.date, i18n)}
                            </Badge>
                        </HStack>
                    )}
                </VStack>
            )}

            {/* Warning Message if instrument not found */}
            {diffItem.hasWarning && (
                <Flex mt={2} pt={2} borderTopWidth="1px" borderColor="border_primary" alignItems="center" gap={2} color="orange.400">
                    <BsExclamationTriangle size={14} />
                    <Text fontSize="xs" fontWeight={500}>
                        {diffItem.warningMessage ?? t("broker_statement_warning_no_security")}
                    </Text>
                </Flex>
            )}
        </Card.Root>
    );
};
