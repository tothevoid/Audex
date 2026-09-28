import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Flex, Icon, Skeleton, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { BsClockHistory } from "react-icons/bs";
import { getTickerHistory } from "@/api/securities/securityApi";
import { SecurityHistory as SecurityHistoryModel } from "@/models/securities/SecurityHistory";
import { formatDate, ChartPeriod } from "@/shared/utilities/formatters/dateFormatter";
import SecurityHistoryHeader, { PERIOD_OPTIONS, HistoryStats } from "./SecurityHistoryHeader";
import SecurityHistoryChart, { ProcessedHistoryItem } from "./SecurityHistoryChart";

interface Props {
    ticker: string;
    currencyName: string;
}

const defaultStats: HistoryStats = {
    startPrice: 0,
    endPrice: 0,
    diff: 0,
    diffPercent: 0,
    minPrice: 0,
    maxPrice: 0,
    avgPrice: 0,
    isPositive: true,
};

const SecurityHistory: React.FC<Props> = ({ ticker, currencyName }) => {
    const { t, i18n } = useTranslation();

    const [history, setHistory] = useState<SecurityHistoryModel | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>("1D");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchHistoryData = useCallback(async (period: ChartPeriod) => {
        setIsLoading(true);
        try {
            const periodOption = PERIOD_OPTIONS.find((p) => p.id === period) ?? PERIOD_OPTIONS[0];
            const data = await getTickerHistory(ticker, periodOption.period);
            setHistory(data || null);
        } finally {
            setIsLoading(false);
        }
    }, [ticker]);

    useEffect(() => {
        fetchHistoryData(selectedPeriod);
    }, [selectedPeriod, fetchHistoryData]);

    const processedHistory: ProcessedHistoryItem[] = useMemo(() => {
        if (!history?.values) return [];
        return history.values.map((item) => {
            const dateObj = new Date(item.date);
            return {
                rawDate: dateObj,
                dateIso: item.date,
                formattedFullDate: formatDate(dateObj, i18n),
                value: item.value,
            };
        });
    }, [history, i18n]);

    const stats: HistoryStats = useMemo(() => {
        if (!history) return defaultStats;
        return {
            startPrice: history.startPrice,
            endPrice: history.endPrice,
            diff: history.diff,
            diffPercent: history.diffPercent,
            minPrice: history.minPrice,
            maxPrice: history.maxPrice,
            avgPrice: history.avgPrice,
            isPositive: history.diff >= 0,
        };
    }, [history]);

    return (
        <Card.Root
            backgroundColor="background_primary"
            borderColor="border_primary"
            borderRadius="xl"
            mt={4}
            boxShadow="sm"
        >
            <Card.Body padding={5}>
                <SecurityHistoryHeader
                    stats={stats}
                    currencyName={currencyName}
                    selectedPeriod={selectedPeriod}
                    onSelectPeriod={setSelectedPeriod}
                    hasData={processedHistory.length > 0}
                />

                {isLoading ? (
                    <Skeleton height="380px" borderRadius="lg" />
                ) : processedHistory.length === 0 ? (
                    <Flex direction="column" align="center" justify="center" gap={3} height="350px" color="text_secondary">
                        <Icon color="text_secondary">
                            <BsClockHistory size={36} />
                        </Icon>
                        <Text fontSize="md" fontWeight={600}>
                            {t("security_history_no_data")}
                        </Text>
                    </Flex>
                ) : (
                    <SecurityHistoryChart
                        data={processedHistory}
                        startPrice={stats.startPrice}
                        avgPrice={stats.avgPrice}
                        isPositive={stats.isPositive}
                        currencyName={currencyName}
                        selectedPeriod={selectedPeriod}
                    />
                )}
            </Card.Body>
        </Card.Root>
    );
};

export default SecurityHistory;