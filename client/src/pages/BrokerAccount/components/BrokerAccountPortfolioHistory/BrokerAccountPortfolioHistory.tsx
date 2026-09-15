import { Fragment, useCallback, useEffect, useState } from "react";
import { SimpleGrid, Stack, Text, Input, Card, Skeleton, Button } from "@chakra-ui/react";
import DatePicker from "react-datepicker";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "../../../../features/UserProfileSettingsModal/hooks/UserProfileContext";
import MoneyCard from "../../../../shared/components/MoneyCard/MoneyCard";
import { Nullable } from "../../../../shared/utilities/nullable";
import { getBrokerAccountPortfolioHistory } from "../../../../api/brokers/brokerAccountPortfolioHistoryApi";
import { BrokerAccountPortfolioHistoryEntity } from "../../../../models/brokers/BrokerAccountPortfolioHistoryEntity";
import { formatMoneyByCurrencyCulture } from "../../../../shared/utilities/formatters/moneyFormatter";
import { getDiffColor } from "../../../../shared/utilities/numericDiffsUtilities";

interface Props {
    brokerAccountId?: Nullable<string>;
}

const formatDateToIso = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const BrokerAccountPortfolioHistory: React.FC<Props> = ({ brokerAccountId }) => {
    const { user } = useUserProfile();
    const { t } = useTranslation();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [history, setHistory] = useState<BrokerAccountPortfolioHistoryEntity | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const fetchHistory = useCallback(async (date: Date) => {
        setIsLoading(true);
        try {
            const isoDate = formatDateToIso(date);
            const result = await getBrokerAccountPortfolioHistory(brokerAccountId, isoDate);
            if (result) {
                setHistory(result);
            }
        } finally {
            setIsLoading(false);
        }
    }, [brokerAccountId]);

    useEffect(() => {
        if (selectedDate) {
            fetchHistory(selectedDate);
        }
    }, [selectedDate, fetchHistory]);

    if (!user) return <Fragment />;

    const currencyName = user.currency.name;

    const pnlSign = history && history.profitAndLoss > 0 ? "+" : "";

    return (
        <SimpleGrid marginBlock={4} gap={4}>
            <Stack direction="row" alignItems="center" gap={4}>
                <Text color="text_primary" fontWeight="bold">
                    {t("broker_account_portfolio_history_date_select")}:
                </Text>
                <DatePicker
                    autoComplete="off"
                    selected={selectedDate}
                    onChange={(date: Date | null) => {
                        if (date) {
                            setSelectedDate(date);
                        }
                    }}
                    maxDate={new Date()}
                    dateFormat="dd.MM.yyyy"
                    customInput={
                        <Input
                            width="200px"
                            color="text_primary"
                            backgroundColor="background_primary"
                            borderColor="border_primary"
                        />
                    }
                />
                <Button
                    size="sm"
                    variant="outline"
                    borderColor="border_primary"
                    color="text_primary"
                    onClick={() => setSelectedDate(new Date())}
                >
                    {t("broker_account_portfolio_history_today")}
                </Button>
            </Stack>

            {isLoading ? (
                <>
                    <SimpleGrid columns={2} gap={4}>
                        <Skeleton height="100px" borderRadius="md" />
                        <Skeleton height="100px" borderRadius="md" />
                    </SimpleGrid>
                    <SimpleGrid columns={2} gap={4}>
                        <Skeleton height="100px" borderRadius="md" />
                        <Skeleton height="100px" borderRadius="md" />
                    </SimpleGrid>
                    <SimpleGrid columns={2} gap={4}>
                        <Skeleton height="100px" borderRadius="md" />
                        <Skeleton height="100px" borderRadius="md" />
                    </SimpleGrid>
                </>
            ) : (
                history && (
                    <>
                        <SimpleGrid columns={2} gap={4}>
                            <Card.Root backgroundColor="background_primary" borderColor="border_primary" color="text_primary">
                                <Card.Header>
                                    {t("broker_account_portfolio_history_portfolio_value")}
                                </Card.Header>
                                <Card.Body fontSize="xl" fontWeight={700} display="flex" flexDirection="row" alignItems="baseline" gap={2} flexWrap="wrap">
                                    <Text as="span">{formatMoneyByCurrencyCulture(history.portfolioValue, currencyName)}</Text>
                                    {history.profitAndLoss !== 0 && (
                                        <Text as="span" color={getDiffColor(history.profitAndLoss)}>
                                            ({pnlSign}{formatMoneyByCurrencyCulture(history.profitAndLoss, currencyName)})
                                        </Text>
                                    )}
                                </Card.Body>
                            </Card.Root>

                            <MoneyCard
                                title={t("broker_account_portfolio_history_main_currency_amount")}
                                value={history.mainCurrencyAmount}
                                currency={currencyName}
                            />
                        </SimpleGrid>
                        <SimpleGrid columns={2} gap={4}>
                            <MoneyCard
                                title={t("broker_account_portfolio_history_total_dividends")}
                                value={history.totalDividends}
                                currency={currencyName}
                            />
                            <MoneyCard
                                title={t("broker_account_portfolio_history_total_tax_deduction")}
                                value={history.totalTaxDeduction}
                                currency={currencyName}
                            />
                        </SimpleGrid>
                        <SimpleGrid columns={2} gap={4}>
                            <MoneyCard
                                title={t("broker_account_portfolio_history_total_deposited")}
                                value={history.totalDeposited}
                                currency={currencyName}
                            />
                            <MoneyCard
                                title={t("broker_account_portfolio_history_total_withdrawn")}
                                value={history.totalWithdraw}
                                currency={currencyName}
                            />
                        </SimpleGrid>
                    </>
                )
            )}
        </SimpleGrid>
    );
};

export default BrokerAccountPortfolioHistory;
