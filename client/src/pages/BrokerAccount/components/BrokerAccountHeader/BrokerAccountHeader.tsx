import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, Flex, HStack, Text, Icon } from "@chakra-ui/react";
import { formatShortDateTime } from "../../../../shared/utilities/formatters/dateFormatter";
import { BrokerAccountPortfolioEntity } from "../../../../models/brokers/BrokerAccountPortfolioEntity";
import { BsWallet2, BsPiggyBank, BsArrowUpRight, BsArrowDownRight, BsClockHistory, BsBank, BsFileEarmarkSpreadsheet, BsPercent } from "react-icons/bs";
import { MdRefresh } from "react-icons/md";
import { TbReceiptTax } from "react-icons/tb";
import { NumericMetricItem } from "../../../../shared/components/MetricItem";
import "../../../../shared/components/RefreshButton/RefreshButton.scss";

interface Props {
    name: string;
    currencyName: string;
    portfolio: BrokerAccountPortfolioEntity;
    onPullQuotations: () => void;
    lastPullDate: Date | null;
    isReloading: boolean;
    onImportStatement?: () => void;
}

const BrokerAccountHeader: React.FC<Props> = ({
    name,
    currencyName,
    portfolio,
    onPullQuotations,
    lastPullDate,
    isReloading,
    onImportStatement
}) => {
    const { t, i18n } = useTranslation();

    const formatPullDate = useCallback(() => {
        if (!lastPullDate) {
            return "";
        }
        const formattedDate = formatShortDateTime(lastPullDate, i18n, false);
        return t("broker_account_page_last_pull_date", { date: formattedDate });
    }, [i18n, lastPullDate, t]);

    const isProfit = portfolio.profitAndLoss >= 0;

    return (
        <Card.Root
            backgroundColor="background_primary"
            borderColor="border_primary"
            borderRadius="xl"
            mb={4}
            boxShadow="sm"
        >
            <Card.Body padding={4}>
                {/* Header Top Bar: Account Title & Sync Action */}
                <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={3} mb={3}>
                    <Text fontSize="xl" fontWeight={800} color="text_primary">
                        {name}
                    </Text>

                    <HStack gap={2}>
                        {onImportStatement && (
                            <HStack
                                as="button"
                                onClick={onImportStatement}
                                px={3}
                                py={1.5}
                                borderRadius="md"
                                backgroundColor="background_secondary"
                                borderColor="border_primary"
                                borderWidth="1px"
                                color="text_secondary"
                                cursor="pointer"
                                transition="all 0.2s"
                                _hover={{ backgroundColor: "background_primary", borderColor: "action_primary" }}
                                alignItems="center"
                                gap={2}
                            >
                                <Icon color="action_primary">
                                    <BsFileEarmarkSpreadsheet size={13} />
                                </Icon>
                                <Text fontSize="xs" fontWeight={600} color="text_primary">
                                    {t("broker_statement_open_button")}
                                </Text>
                            </HStack>
                        )}

                        {/* Integrated Sync Date & Refresh Pill Button */}
                        <HStack
                            as="button"
                            onClick={isReloading ? undefined : onPullQuotations}
                            px={3}
                            py={1.5}
                            borderRadius="md"
                            backgroundColor="background_secondary"
                            borderColor="border_primary"
                            borderWidth="1px"
                            color="text_secondary"
                            cursor={isReloading ? "not-allowed" : "pointer"}
                            opacity={isReloading ? 0.6 : 1}
                            transition="all 0.2s"
                            _hover={isReloading ? {} : { backgroundColor: "background_primary", borderColor: "action_primary" }}
                            alignItems="center"
                            gap={2}
                        >
                            <Icon color="text_secondary">
                                <BsClockHistory size={13} />
                            </Icon>
                            {lastPullDate && (
                                <Text fontSize="xs" fontWeight={500} color="text_secondary">
                                    {formatPullDate()}
                                </Text>
                            )}
                            <Icon
                                transition="transform 0.3s ease"
                                animation={isReloading ? "loading-spin 1.5s linear infinite" : "none"}
                                color="action_primary"
                            >
                                <MdRefresh size={16} />
                            </Icon>
                        </HStack>
                    </HStack>
                </Flex>

                {/* Metrics list */}
                <Flex
                    pt={3}
                    mt={3}
                    borderTopWidth="1px"
                    borderColor="border_primary"
                    justifyContent="flex-start"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={{ base: 4, md: 8 }}
                >
                    <NumericMetricItem
                        icon={<BsBank size={15} />}
                        iconBg="rgba(234, 179, 8, 0.15)"
                        iconColor="yellow.400"
                        label={t("broker_account_portfolio_history_portfolio_value")}
                        value={portfolio.currentAmount}
                        currency={currencyName}
                        size="sm"
                    />

                    <NumericMetricItem
                        icon={isProfit ? <BsArrowUpRight size={15} /> : <BsArrowDownRight size={15} />}
                        iconBg={isProfit ? "pnl_positive_bg" : "pnl_negative_bg"}
                        iconColor={isProfit ? "pnl_positive" : "pnl_negative"}
                        label={t("broker_account_page_total_profit_and_loss")}
                        value={portfolio.profitAndLoss}
                        currency={currencyName}
                        isPnl
                        size="sm"
                    />

                    <NumericMetricItem
                        icon={<BsWallet2 size={15} />}
                        iconBg="rgba(59, 130, 246, 0.15)"
                        iconColor="blue.400"
                        label={t("broker_account_portfolio_history_main_currency_amount")}
                        value={portfolio.mainCurrencyAmount}
                        currency={currencyName}
                        size="sm"
                    />

                    <NumericMetricItem
                        icon={<BsPiggyBank size={15} />}
                        iconBg="rgba(34, 197, 94, 0.15)"
                        iconColor="green.400"
                        label={t("broker_account_page_dividends_earnings")}
                        value={portfolio.dividendsIncome}
                        currency={currencyName}
                        size="sm"
                    />

                    <NumericMetricItem
                        icon={<TbReceiptTax size={15} />}
                        iconBg="rgba(168, 85, 247, 0.15)"
                        iconColor="purple.400"
                        label={t("broker_account_page_deduction_taxes")}
                        value={portfolio.taxDeductions}
                        currency={currencyName}
                        size="sm"
                    />

                    <NumericMetricItem
                        icon={<BsPercent size={15} />}
                        iconBg="rgba(249, 115, 22, 0.15)"
                        iconColor="orange.400"
                        label={t("broker_account_page_broker_commissions")}
                        value={portfolio.brokerCommissions ?? 0}
                        currency={currencyName}
                        size="sm"
                    />

                    <NumericMetricItem
                        icon={<BsPercent size={15} />}
                        iconBg="rgba(236, 72, 153, 0.15)"
                        iconColor="pink.400"
                        label={t("broker_account_page_exchange_commissions")}
                        value={portfolio.stockExchangeCommissions ?? 0}
                        currency={currencyName}
                        size="sm"
                    />

                    {Boolean(portfolio.transactionTaxes) && (
                        <NumericMetricItem
                            icon={<TbReceiptTax size={15} />}
                            iconBg="rgba(239, 68, 68, 0.15)"
                            iconColor="red.400"
                            label={t("broker_account_page_transaction_taxes")}
                            value={portfolio.transactionTaxes ?? 0}
                            currency={currencyName}
                            size="sm"
                        />
                    )}
                </Flex>
            </Card.Body>
        </Card.Root>
    );
};

export default BrokerAccountHeader;