import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Nullable } from "@/shared/utilities/nullable";
import { BrokerAccountDayTransferEntity } from "@/models/brokers/BrokerAccountDayTransferEntity";
import { BrokerAccountMonthTransferEntity } from "@/models/brokers/BrokerAccountMonthTransferEntity";
import { BrokerAccountMonthTransfersHistoryEntity } from "@/models/brokers/BrokerAccountMonthTransfersHistoryEntity";
import { BrokerAccountYearTransfersHistoryEntity } from "@/models/brokers/BrokerAccountYearTransfersHistoryEntity";
import { BrokerAccountTransfersAvailableDatesEntity } from "@/models/brokers/BrokerAccountTransfersAvailableDatesEntity";
import {
    getMonthTransfersHistory,
    getYearTransfersHistory,
    getTransfersAvailableDates
} from "@/api/brokers/brokerAccountSummaryApi";
import { getChartColor } from "@/shared/constants/chartColors";
import { formatShortMonth } from "@/shared/utilities/formatters/dateFormatter";
import {
    AccountItem,
    MONTH_RANGE,
    TransfersChartRow,
    TransfersHistoryFilterState,
    YEAR_RANGE
} from "../components/BrokerAccountTransfersHistoryChart/types";

interface UseBrokerAccountTransfersHistoryOptions {
    brokerAccountId?: Nullable<string>;
    selectedAccountId?: Nullable<string>;
    onAccountChange?: (accountId: Nullable<string>) => void;
}

interface UseBrokerAccountTransfersHistoryResult {
    availableDates: BrokerAccountTransfersAvailableDatesEntity | null;
    currentFilter: TransfersHistoryFilterState;
    handleFilterChange: (newFilter: TransfersHistoryFilterState) => void;
    chartData: TransfersChartRow[];
    accountList: AccountItem[];
    depositedByPeriod: number;
    withdrawnByPeriod: number;
}

export const useBrokerAccountTransfersHistory = ({
    brokerAccountId,
    selectedAccountId,
    onAccountChange
}: UseBrokerAccountTransfersHistoryOptions): UseBrokerAccountTransfersHistoryResult => {
    const { t, i18n } = useTranslation();

    const effectiveAccountId = brokerAccountId ?? selectedAccountId;

    const [availableDates, setAvailableDates] = useState<BrokerAccountTransfersAvailableDatesEntity | null>(null);
    const [currentFilter, setCurrentFilter] = useState<TransfersHistoryFilterState>({
        rangeType: YEAR_RANGE,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        accountId: effectiveAccountId
    });

    const [periodHistory, setPeriodHistory] = useState<Nullable<BrokerAccountMonthTransfersHistoryEntity | BrokerAccountYearTransfersHistoryEntity>>(null);

    // Fetch available dates from database when effective account changes
    useEffect(() => {
        let isMounted = true;
        const fetchDates = async () => {
            const data = await getTransfersAvailableDates(effectiveAccountId);
            if (!isMounted || !data) {
                return;
            }

            setAvailableDates(data);

            if (data.availableYears?.length > 0) {
                const defaultYear = data.availableYears[0];
                const monthsForYear = data.availableMonthsByYear?.[defaultYear] ?? [1];
                const defaultMonth = monthsForYear[monthsForYear.length - 1] ?? 1;

                setCurrentFilter((previousFilter) => ({
                    ...previousFilter,
                    year: defaultYear,
                    month: defaultMonth,
                    accountId: effectiveAccountId
                }));
            }
        };

        fetchDates();

        return () => {
            isMounted = false;
        };
    }, [effectiveAccountId]);

    // Handle single filter change event from child component
    const handleFilterChange = useCallback(
        (newFilter: TransfersHistoryFilterState) => {
            setCurrentFilter((previousFilter) => {
                const hasYearChanged = newFilter.year !== previousFilter.year;
                if (!hasYearChanged) {
                    return newFilter;
                }

                const availableMonths = availableDates?.availableMonthsByYear?.[newFilter.year] ?? [];
                const newMonthValue = availableMonths.length > 0
                    ? availableMonths[availableMonths.length - 1]
                    : newFilter.month;

                return {
                    ...newFilter,
                    month: newMonthValue
                };
            });

            if (onAccountChange && newFilter.accountId !== selectedAccountId) {
                onAccountChange(newFilter.accountId);
            }
        },
        [availableDates, onAccountChange, selectedAccountId]
    );

    // Fetch pre-aggregated transfers data from backend
    useEffect(() => {
        if (!availableDates) {
            return;
        }

        let isMounted = true;
        const fetchHistory = async () => {
            if (!availableDates.availableYears?.length) {
                if (isMounted) {
                    setPeriodHistory(null);
                }
                return;
            }

            const targetAccountId = brokerAccountId ?? currentFilter.accountId;
            if (currentFilter.rangeType === MONTH_RANGE) {
                const data = await getMonthTransfersHistory(targetAccountId, currentFilter.month, currentFilter.year);
                if (isMounted) {
                    setPeriodHistory(data ?? null);
                }
            } else {
                const data = await getYearTransfersHistory(targetAccountId, currentFilter.year);
                if (isMounted) {
                    setPeriodHistory(data ?? null);
                }
            }
        };

        fetchHistory();

        return () => {
            isMounted = false;
        };
    }, [availableDates, brokerAccountId, currentFilter]);

    // Calculate chart rows, account list and period totals from backend response
    const { chartData, accountList, depositedByPeriod, withdrawnByPeriod } = useMemo(() => {
        if (!periodHistory) {
            return {
                chartData: [],
                accountList: [],
                depositedByPeriod: 0,
                withdrawnByPeriod: 0
            };
        }

        const isMonth = currentFilter.rangeType === MONTH_RANGE;
        const rawItems = isMonth
            ? (periodHistory as BrokerAccountMonthTransfersHistoryEntity).days ?? []
            : (periodHistory as BrokerAccountYearTransfersHistoryEntity).months ?? [];

        const rows: TransfersChartRow[] = rawItems.map((item) => {
            const name = isMonth
                ? String((item as BrokerAccountDayTransferEntity).dayIndex)
                : formatShortMonth((item as BrokerAccountMonthTransferEntity).monthIndex, i18n, currentFilter.year);

            const row: TransfersChartRow = {
                name,
                totalIncome: item.totalDeposited,
                totalWithdraw: item.totalWithdrawn,
                accountValues: item.accountValues ?? []
            };

            if (item.accountValues && item.accountValues.length > 0) {
                item.accountValues.forEach((accountValue) => {
                    row[`income_${accountValue.accountId}`] = accountValue.deposited;
                    row[`withdraw_${accountValue.accountId}`] = accountValue.withdrawn;
                });
            }

            return row;
        });

        const accounts: AccountItem[] = (periodHistory.accounts ?? []).map((accountValue, accountIndex) => ({
            id: accountValue.accountId,
            name: accountValue.accountName || t("filter_no_category"),
            color: getChartColor(accountIndex),
            deposited: accountValue.deposited,
            withdrawn: accountValue.withdrawn
        }));

        return {
            chartData: rows,
            accountList: accounts,
            depositedByPeriod: periodHistory.totalDeposited,
            withdrawnByPeriod: periodHistory.totalWithdrawn
        };
    }, [periodHistory, currentFilter.rangeType, currentFilter.year, i18n, t]);

    return {
        availableDates,
        currentFilter,
        handleFilterChange,
        chartData,
        accountList,
        depositedByPeriod,
        withdrawnByPeriod
    };
};
