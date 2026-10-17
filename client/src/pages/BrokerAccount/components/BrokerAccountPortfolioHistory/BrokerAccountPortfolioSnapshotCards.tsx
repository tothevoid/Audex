import React from "react";
import { Card, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { BrokerAccountPortfolioTimelinePointEntity } from "@/models/brokers/BrokerAccountPortfolioTimelinePointEntity";
import { Nullable } from "@/shared/utilities/nullable";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { getDiffColor } from "@/shared/utilities/numericDiffsUtilities";
import MoneyCard from "@/shared/components/MoneyCard/MoneyCard";
import { LoadingGrid } from "@/shared/components/LoadingGrid";

interface Props {
    history: Nullable<BrokerAccountPortfolioTimelinePointEntity>;
    currencyName: string;
    isLoading?: boolean;
}

export const BrokerAccountPortfolioSnapshotCards: React.FC<Props> = ({
    history,
    currencyName,
    isLoading = false,
}) => {
    const { t } = useTranslation();

    if (!isLoading && !history) {
        return null;
    }

    const pnlSign = history && history.profitAndLoss > 0 ? "+" : "";

    return (
        <LoadingGrid
            isLoading={isLoading}
            count={6}
            height="100px"
            borderRadius="md"
            columns={{ base: 1, md: 2 }}
            gap={4}
            wrapChildren
        >
            <Card.Root
                backgroundColor="background_primary"
                borderColor="border_primary"
                color="text_primary"
            >
                <Card.Header>
                    {t("broker_account_portfolio_history_portfolio_value")}
                </Card.Header>
                <Card.Body
                    fontSize="xl"
                    fontWeight={700}
                    display="flex"
                    flexDirection="row"
                    alignItems="baseline"
                    gap={2}
                    flexWrap="wrap"
                >
                    <Text as="span">
                        {formatMoneyByCurrencyCulture(
                            history?.portfolioValue ?? 0,
                            currencyName
                        )}
                    </Text>
                    {history && history.profitAndLoss !== 0 && (
                        <Text
                            as="span"
                            color={getDiffColor(history.profitAndLoss)}
                        >
                            ({pnlSign}
                            {formatMoneyByCurrencyCulture(
                                history.profitAndLoss,
                                currencyName
                            )}
                            )
                        </Text>
                    )}
                </Card.Body>
            </Card.Root>

            <MoneyCard
                title={t(
                    "broker_account_portfolio_history_main_currency_amount"
                )}
                value={history?.mainCurrencyAmount ?? 0}
                currency={currencyName}
            />

            <MoneyCard
                title={t("broker_account_portfolio_history_total_dividends")}
                value={history?.totalDividends ?? 0}
                currency={currencyName}
            />

            <MoneyCard
                title={t(
                    "broker_account_portfolio_history_total_tax_deduction"
                )}
                value={history?.totalTaxDeduction ?? 0}
                currency={currencyName}
            />

            <MoneyCard
                title={t("broker_account_portfolio_history_total_deposited")}
                value={history?.totalDeposited ?? 0}
                currency={currencyName}
            />

            <MoneyCard
                title={t("broker_account_portfolio_history_total_withdrawn")}
                value={history?.totalWithdrawn ?? 0}
                currency={currencyName}
            />
        </LoadingGrid>
    );
};

export default BrokerAccountPortfolioSnapshotCards;
