import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";
import BaseSelect from "../../../../shared/components/BaseSelect/BaseSelect";
import ButtonGroup from "../../../../shared/components/ButtonGroup/ButtonGroup";
import { Nullable } from "../../../../shared/utilities/nullable";
import { BrokerAccountEntity } from "../../../../models/brokers/BrokerAccountEntity";
import { BrokerAccountTransfersAvailableDatesEntity } from "../../../../models/brokers/BrokerAccountTransfersAvailableDatesEntity";
import {
    AccountSelectOption,
    MONTH_RANGE,
    NumericOption,
    RangeType,
    TransfersHistoryFilterState,
    YEAR_RANGE
} from "./types";

interface Props {
    brokerAccountId?: Nullable<string>;
    brokerAccounts?: BrokerAccountEntity[];
    availableDates: BrokerAccountTransfersAvailableDatesEntity | null;
    onFilterChange: (filter: TransfersHistoryFilterState) => void;
}

const TransfersHistoryFilterBar: React.FC<Props> = ({
    brokerAccountId,
    brokerAccounts = [],
    availableDates,
    onFilterChange
}) => {
    const { t } = useTranslation();

    const rangeTypes: RangeType[] = useMemo(
        () => [
            { label: t("transfers_history_chart_range_year"), value: YEAR_RANGE },
            { label: t("transfers_history_chart_range_month"), value: MONTH_RANGE }
        ],
        [i18n.language, t]
    );

    const [selectedAccountId, setSelectedAccountId] = useState<Nullable<string>>(null);
    const [selectedRangeType, setSelectedRangeType] = useState<RangeType>(rangeTypes[0]);
    const [selectedYear, setSelectedYear] = useState<NumericOption>({
        label: new Date().getFullYear().toString(),
        value: new Date().getFullYear()
    });
    const [selectedMonth, setSelectedMonth] = useState<NumericOption>({
        label: new Date().toLocaleString(i18n.language, { month: "short" }),
        value: new Date().getMonth() + 1
    });

    // Available years from database
    const yearsOptions: NumericOption[] = useMemo(() => {
        if (!availableDates?.availableYears?.length) {
            const currentYear = new Date().getFullYear();
            return [{ label: currentYear.toString(), value: currentYear }];
        }
        return availableDates.availableYears.map((year) => ({
            label: year.toString(),
            value: year
        }));
    }, [availableDates]);

    // Available months for selected year from database
    const monthsOptions: NumericOption[] = useMemo(() => {
        const availableMonths = availableDates?.availableMonthsByYear?.[selectedYear.value];
        if (!availableMonths?.length) {
            return Array.from({ length: 12 }, (_, monthIndex) => ({
                label: new Date(0, monthIndex).toLocaleString(i18n.language, { month: "short" }),
                value: monthIndex + 1
            }));
        }
        return availableMonths.map((monthIndex) => ({
            label: new Date(0, monthIndex - 1).toLocaleString(i18n.language, { month: "short" }),
            value: monthIndex
        }));
    }, [availableDates, selectedYear.value, i18n.language]);

    // Initialize/sync default selections when available dates are loaded
    useEffect(() => {
        if (!availableDates?.availableYears?.length) {
            return;
        }

        const defaultYear = availableDates.availableYears[0];
        const monthsForYear = availableDates.availableMonthsByYear[defaultYear] ?? [1];
        const defaultMonth = monthsForYear[monthsForYear.length - 1] ?? 1;

        const newYearOption: NumericOption = { label: defaultYear.toString(), value: defaultYear };
        const newMonthOption: NumericOption = {
            label: new Date(0, defaultMonth - 1).toLocaleString(i18n.language, { month: "short" }),
            value: defaultMonth
        };

        setSelectedYear(newYearOption);
        setSelectedMonth(newMonthOption);

        onFilterChange({
            rangeType: selectedRangeType,
            year: defaultYear,
            month: defaultMonth,
            accountId: brokerAccountId ?? selectedAccountId
        });
    }, [availableDates, brokerAccountId]);

    const handleAccountChange = useCallback(
        (option: Nullable<AccountSelectOption>) => {
            const newAccountId = option?.id ?? null;
            setSelectedAccountId(newAccountId);
            onFilterChange({
                rangeType: selectedRangeType,
                year: selectedYear.value,
                month: selectedMonth.value,
                accountId: newAccountId
            });
        },
        [selectedRangeType, selectedYear.value, selectedMonth.value, onFilterChange]
    );

    const handleRangeTypeChange = useCallback(
        (rangeType: RangeType) => {
            setSelectedRangeType(rangeType);
            onFilterChange({
                rangeType,
                year: selectedYear.value,
                month: selectedMonth.value,
                accountId: brokerAccountId ?? selectedAccountId
            });
        },
        [brokerAccountId, selectedAccountId, selectedYear.value, selectedMonth.value, onFilterChange]
    );

    const handleYearChange = useCallback(
        (yearOption: NumericOption) => {
            setSelectedYear(yearOption);
            const availableMonths = availableDates?.availableMonthsByYear?.[yearOption.value] ?? [];
            let newMonthValue = selectedMonth.value;

            if (availableMonths.length > 0) {
                newMonthValue = availableMonths[availableMonths.length - 1];
                setSelectedMonth({
                    label: new Date(0, newMonthValue - 1).toLocaleString(i18n.language, { month: "short" }),
                    value: newMonthValue
                });
            }

            onFilterChange({
                rangeType: selectedRangeType,
                year: yearOption.value,
                month: newMonthValue,
                accountId: brokerAccountId ?? selectedAccountId
            });
        },
        [availableDates, selectedMonth.value, selectedRangeType, brokerAccountId, selectedAccountId, i18n.language, onFilterChange]
    );

    const handleMonthChange = useCallback(
        (monthOption: NumericOption) => {
            setSelectedMonth(monthOption);
            onFilterChange({
                rangeType: selectedRangeType,
                year: selectedYear.value,
                month: monthOption.value,
                accountId: brokerAccountId ?? selectedAccountId
            });
        },
        [selectedRangeType, selectedYear.value, brokerAccountId, selectedAccountId, onFilterChange]
    );

    // Broker account options for dropdown
    const brokerAccountOptions: AccountSelectOption[] = useMemo(() => {
        return [
            { id: null, name: t("transfers_history_chart_all_accounts") },
            ...brokerAccounts.map((account) => ({ id: account.id, name: account.name }))
        ];
    }, [brokerAccounts, t]);

    const selectedAccountOption = useMemo(() => {
        return brokerAccountOptions.find((option) => option.id === selectedAccountId) ?? brokerAccountOptions[0];
    }, [brokerAccountOptions, selectedAccountId]);

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

            <ButtonGroup<string>
                options={rangeTypes.map((range) => ({ value: range.value, label: range.label }))}
                value={selectedRangeType.value}
                onChange={(selectedValue) => {
                    const foundRange = rangeTypes.find((range) => range.value === selectedValue);
                    if (foundRange) {
                        handleRangeTypeChange(foundRange);
                    }
                }}
                size="sm"
            />

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

            {selectedRangeType.value === MONTH_RANGE && (
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
