import React, { Fragment, useEffect, useState } from "react";
import { SimpleGrid, Stack, Text } from "@chakra-ui/react";
import DatePicker from "@/shared/components/DatePicker/DatePicker";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "@/features/UserProfileSettingsModal/hooks/UserProfileContext";
import { Nullable } from "@/shared/utilities/nullable";
import { convertToDateOnly } from "@/shared/utilities/dateUtils";
import {
    getBrokerAccountPortfolioDateBounds,
    getBrokerAccountPortfolioHistory,
    getBrokerAccountPortfolioHistoryByPeriod,
} from "@/api/brokers/brokerAccountPortfolioHistoryApi";
import { BrokerAccountPortfolioDateBoundsEntity } from "@/models/brokers/BrokerAccountPortfolioDateBoundsEntity";
import { BrokerAccountPortfolioTimelinePointEntity } from "@/models/brokers/BrokerAccountPortfolioTimelinePointEntity";
import { BrokerAccountHistoryChart } from "@/pages/BrokerAccount/components/BrokerAccountHistoryChart/BrokerAccountHistoryChart";
import { ChartPeriod } from "@/models/common/ChartPeriod";
import { BrokerAccountPortfolioSnapshotCards } from "./BrokerAccountPortfolioSnapshotCards";

interface Props {
    brokerAccountId?: Nullable<string>;
}

const BrokerAccountPortfolioHistory: React.FC<Props> = ({ brokerAccountId }) => {
    const { user } = useUserProfile();
    const { t } = useTranslation();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [dateBounds, setDateBounds] =
        useState<Nullable<BrokerAccountPortfolioDateBoundsEntity>>(null);
    const [history, setHistory] =
        useState<Nullable<BrokerAccountPortfolioTimelinePointEntity>>(null);
    const [isSnapshotLoading, setIsSnapshotLoading] = useState<boolean>(false);

    const [selectedPeriod, setSelectedPeriod] =
        useState<ChartPeriod>(ChartPeriod.Month1);
    const [rangePoints, setRangePoints] = useState<
        BrokerAccountPortfolioTimelinePointEntity[]
    >([]);
    const [isChartLoading, setIsChartLoading] = useState<boolean>(false);

    // 1. Load Date Bounds (Min & Max dates)
    useEffect(() => {
        let isMounted = true;
        const loadBounds = async () => {
            const boundsResult = await getBrokerAccountPortfolioDateBounds(
                brokerAccountId
            );
            if (boundsResult && isMounted) {
                setDateBounds(boundsResult);
                if (boundsResult.maxDate) {
                    setSelectedDate((previousDate) =>
                        previousDate > boundsResult.maxDate!
                            ? boundsResult.maxDate!
                            : previousDate
                    );
                }
            }
        };

        loadBounds();

        return () => {
            isMounted = false;
        };
    }, [brokerAccountId]);

    const minDate = dateBounds?.minDate ?? null;
    const maxDate = dateBounds?.maxDate ?? new Date();

    // 2. Load Chart Range Data
    useEffect(() => {
        if (!dateBounds) {
            return;
        }

        let isMounted = true;
        const loadRange = async () => {
            setIsChartLoading(true);
            setIsSnapshotLoading(true);
            try {
                const points = await getBrokerAccountPortfolioHistoryByPeriod(
                    selectedPeriod,
                    brokerAccountId,
                    dateBounds.maxDate,
                    dateBounds.minDate
                );

                if (isMounted) {
                    setRangePoints(points);
                    const formattedSelectedDate = convertToDateOnly(selectedDate);
                    const matchedPoint =
                        points.find((point) => point.date === formattedSelectedDate) ??
                        points[points.length - 1];

                    if (matchedPoint) {
                        setHistory(matchedPoint);
                    }
                }
            } finally {
                if (isMounted) {
                    setIsChartLoading(false);
                    setIsSnapshotLoading(false);
                }
            }
        };

        loadRange();

        return () => {
            isMounted = false;
        };
    }, [brokerAccountId, selectedPeriod, dateBounds]);

    // 3. Load Single Date Snapshot (only if selected date is outside chart range)
    useEffect(() => {
        if (!selectedDate || isChartLoading || !dateBounds) {
            return;
        }

        const formattedSelectedDate = convertToDateOnly(selectedDate);
        const existingPoint = rangePoints.find(
            (point) => point.date === formattedSelectedDate
        );

        if (existingPoint) {
            setHistory(existingPoint);
            setIsSnapshotLoading(false);
            return;
        }

        if (rangePoints.length > 0) {
            let isMounted = true;
            const loadSnapshot = async () => {
                setIsSnapshotLoading(true);
                try {
                    const result = await getBrokerAccountPortfolioHistory(
                        brokerAccountId,
                        selectedDate
                    );
                    if (result && isMounted) {
                        setHistory(result);
                    }
                } finally {
                    if (isMounted) {
                        setIsSnapshotLoading(false);
                    }
                }
            };

            loadSnapshot();

            return () => {
                isMounted = false;
            };
        }
    }, [brokerAccountId, selectedDate, rangePoints, isChartLoading, dateBounds]);

    if (!user) return <Fragment />;

    const currencyName = user.currency.name;

    return (
        <SimpleGrid marginBlock={4} gap={4}>
            {/* Interactive Portfolio & P&L Dynamics Chart */}
            <BrokerAccountHistoryChart
                data={rangePoints}
                currencyName={currencyName}
                selectedPeriod={selectedPeriod}
                onSelectPeriod={setSelectedPeriod}
                isLoading={isChartLoading}
                onPointClick={setSelectedDate}
            />

            {/* Date Selection for Detailed Snapshot */}
            <Stack direction="row" alignItems="center" gap={4}>
                <Text color="text_primary" fontWeight="bold">
                    {t("broker_account_portfolio_history_date_select")}:
                </Text>
                <DatePicker
                    value={selectedDate}
                    onChange={(date: Date | null) => {
                        if (date) {
                            setSelectedDate(date);
                        }
                    }}
                    minDate={minDate}
                    maxDate={maxDate}
                    width="200px"
                    fullWidth={false}
                />
            </Stack>

            {/* Snapshot Cards */}
            <BrokerAccountPortfolioSnapshotCards
                history={history}
                currencyName={currencyName}
                isLoading={isSnapshotLoading}
            />
        </SimpleGrid>
    );
};

export default BrokerAccountPortfolioHistory;
