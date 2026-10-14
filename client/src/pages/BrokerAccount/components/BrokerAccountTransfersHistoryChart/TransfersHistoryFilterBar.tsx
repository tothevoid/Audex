import React, { useMemo, useCallback } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import BaseSelect from "@/shared/components/BaseSelect/BaseSelect";
import ButtonGroup from "@/shared/components/ButtonGroup/ButtonGroup";
import { Nullable } from "@/shared/utilities/nullable";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";
import { BrokerAccountTransfersAvailableDatesEntity } from "@/models/brokers/BrokerAccountTransfersAvailableDatesEntity";
import { formatShortMonth } from "@/shared/utilities/formatters/dateFormatter";
import {
    AccountSelectOption,
    MONTH_RANGE,
    NumericOption,
    RangeType,
    TransfersHistoryFilterState,
    TransfersRangeType,
    YEAR_RANGE
} from "./types";

interface Props {
    brokerAccountId?: Nullable<string>;
    brokerAccounts?: BrokerAccountEntity[];
    availableDates: BrokerAccountTransfersAvailableDatesEntity | null;
    currentFilter: TransfersHistoryFilterState;
    onFilterChange: (filter: TransfersHistoryFilterState) => void;
}

const TransfersHistoryFilterBar: React.FC<Props> = ({
    brokerAccountId,
    brokerAccounts = [],
    availableDates,
    currentFilter,
    onFilterChange
}) => {
    const { t, i18n } = useTranslation();

    const rangeTypes: RangeType[] = useMemo(
        () => [
            { label: t("transfers_history_chart_range_year"), value: YEAR_RANGE },
            { label: t("transfers_history_chart_range_month"), value: MONTH_RANGE }
        ],
        [t]
    );

    const selectedRangeType = useMemo(
        () => rangeTypes.find((range) => range.value === currentFilter.rangeType) ?? rangeTypes[0],
        [rangeTypes, currentFilter.rangeType]
    );

    // Available years from database
    const yearsOptions: NumericOption[] = useMemo(() => {
        if (!availableDates?.availableYears?.length) {
            return [];
        }
        return availableDates.availableYears.map((year) => ({
            label: year.toString(),
            value: year
        }));
    }, [availableDates]);

    // Available months for selected year from database
    const monthsOptions: NumericOption[] = useMemo(() => {
        const availableMonths = availableDates?.availableMonthsByYear?.[currentFilter.year] ?? [];
        return availableMonths.map((monthIndex) => ({
            label: formatShortMonth(monthIndex, i18n, currentFilter.year),
            value: monthIndex
        }));
    }, [availableDates, currentFilter.year, i18n]);

    const selectedYear = useMemo(
        () => yearsOptions.find((option) => option.value === currentFilter.year) ?? yearsOptions[0],
        [yearsOptions, currentFilter.year]
    );

    const selectedMonth = useMemo(
        () => monthsOptions.find((option) => option.value === currentFilter.month) ?? monthsOptions[0],
        [monthsOptions, currentFilter.month]
    );

    const handleAccountChange = useCallback(
        (option: Nullable<AccountSelectOption>) => {
            const newAccountId = option?.id ?? null;
            onFilterChange({
                ...currentFilter,
                accountId: newAccountId
            });
        },
        [currentFilter, onFilterChange]
    );

    const handleRangeTypeChange = useCallback(
        (rangeType: TransfersRangeType) => {
            onFilterChange({
                ...currentFilter,
                rangeType
            });
        },
        [currentFilter, onFilterChange]
    );

    const handleYearChange = useCallback(
        (yearOption: NumericOption) => {
            onFilterChange({
                ...currentFilter,
                year: yearOption.value
            });
        },
        [currentFilter, onFilterChange]
    );

    const handleMonthChange = useCallback(
        (monthOption: NumericOption) => {
            onFilterChange({
                ...currentFilter,
                month: monthOption.value
            });
        },
        [currentFilter, onFilterChange]
    );

    // Broker account options for dropdown
    const brokerAccountOptions: AccountSelectOption[] = useMemo(() => {
        return [
            { id: null, name: t("transfers_history_chart_all_accounts") },
            ...brokerAccounts.map((account) => ({ id: account.id, name: account.name }))
        ];
    }, [brokerAccounts, t]);

    const selectedAccountOption = useMemo(() => {
        return brokerAccountOptions.find((option) => option.id === currentFilter.accountId) ?? brokerAccountOptions[0];
    }, [brokerAccountOptions, currentFilter.accountId]);

    return (
        <Flex
            p={3}
            mb={4}
            borderRadius="lg"
            backgroundColor="background_secondary"
            borderColor="border_primary"
            borderWidth="1px"
            alignItems="center"
            gap={3}
            flexWrap="wrap"
        >
            {!brokerAccountId && (
                <Box minW="220px" maxW="280px">
                    <BaseSelect
                        placeholder={t("transfers_history_chart_all_accounts")}
                        selectedValue={selectedAccountOption}
                        collection={brokerAccountOptions}
                        onSelected={handleAccountChange}
                        labelSelector={(option) => option.name}
                        valueSelector={(option) => option.id ?? "all"}
                    />
                </Box>
            )}

            <ButtonGroup<TransfersRangeType>
                options={rangeTypes.map((range) => ({ value: range.value, label: range.label }))}
                value={selectedRangeType.value}
                onChange={(selectedValue) => {
                    handleRangeTypeChange(selectedValue);
                }}
                size="sm"
            />

            {yearsOptions.length > 0 && (
                <Box minW="105px">
                    <BaseSelect
                        placeholder={t("transfers_history_chart_range_year")}
                        selectedValue={selectedYear}
                        collection={yearsOptions}
                        onSelected={(yearOption) => yearOption && handleYearChange(yearOption)}
                        labelSelector={(yearOption) => yearOption.label}
                        valueSelector={(yearOption) => yearOption.value}
                    />
                </Box>
            )}

            {currentFilter.rangeType === MONTH_RANGE && monthsOptions.length > 0 && (
                <Box minW="115px">
                    <BaseSelect
                        placeholder={t("transfers_history_chart_range_month")}
                        selectedValue={selectedMonth}
                        collection={monthsOptions}
                        onSelected={(monthOption) => monthOption && handleMonthChange(monthOption)}
                        labelSelector={(monthOption) => monthOption.label}
                        valueSelector={(monthOption) => monthOption.value}
                    />
                </Box>
            )}
        </Flex>
    );
};

export default TransfersHistoryFilterBar;
