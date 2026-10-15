import React, { useMemo } from "react";
import { Button, HStack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
    ALL_CHART_PERIODS,
    ChartPeriod,
} from "@/shared/utilities/formatters/dateFormatter";

export type ChartPeriodVariant = "short" | "full";

export interface ChartPeriodOption<T = ChartPeriod> {
    value: T;
    label: string;
}

export interface ChartPeriodSelectorProps<T = ChartPeriod> {
    periods?: readonly T[];
    options?: readonly ChartPeriodOption<T>[];
    selectedPeriod: T;
    onSelectPeriod: (period: T) => void;
    isDisabled?: boolean;
    size?: "xs" | "sm";
    variant?: ChartPeriodVariant;
    formatLabel?: (period: T) => string;
}

const SHORT_PERIOD_LABEL_KEYS: Record<ChartPeriod, string> = {
    [ChartPeriod.Day1]: "chart_period_1d",
    [ChartPeriod.Week1]: "chart_period_1w",
    [ChartPeriod.Month1]: "chart_period_1m",
    [ChartPeriod.Month3]: "chart_period_3m",
    [ChartPeriod.Month6]: "chart_period_6m",
    [ChartPeriod.Year1]: "chart_period_1y",
    [ChartPeriod.Year5]: "chart_period_5y",
    [ChartPeriod.Year10]: "chart_period_10y",
    [ChartPeriod.All]: "chart_period_all",
};

const FULL_PERIOD_LABEL_KEYS: Record<ChartPeriod, string> = {
    [ChartPeriod.Day1]: "chart_period_full_1d",
    [ChartPeriod.Week1]: "chart_period_full_1w",
    [ChartPeriod.Month1]: "chart_period_full_1m",
    [ChartPeriod.Month3]: "chart_period_full_3m",
    [ChartPeriod.Month6]: "chart_period_full_6m",
    [ChartPeriod.Year1]: "chart_period_full_1y",
    [ChartPeriod.Year5]: "chart_period_full_5y",
    [ChartPeriod.Year10]: "chart_period_full_10y",
    [ChartPeriod.All]: "chart_period_full_all",
};

export function ChartPeriodSelector<T = ChartPeriod>({
    periods,
    options,
    selectedPeriod,
    onSelectPeriod,
    isDisabled = false,
    size = "xs",
    variant = "short",
    formatLabel,
}: ChartPeriodSelectorProps<T>): React.ReactElement {
    const { t: translate } = useTranslation();
    const isSmall = size === "xs";

    const resolvedOptions = useMemo<readonly ChartPeriodOption<T>[]>(() => {
        if (options && options.length > 0) {
            return options;
        }

        const effectivePeriods = periods ?? (ALL_CHART_PERIODS as readonly T[]);
        const dictionary = variant === "full" ? FULL_PERIOD_LABEL_KEYS : SHORT_PERIOD_LABEL_KEYS;

        return effectivePeriods.map((period) => {
            if (formatLabel) {
                return { value: period, label: formatLabel(period) };
            }

            const chartPeriod = period as unknown as ChartPeriod;
            const translationKey = dictionary[chartPeriod];
            const label = translationKey ? translate(translationKey) : String(period);

            return { value: period, label };
        });
    }, [options, periods, variant, formatLabel, translate]);

    return (
        <HStack
            gap={1}
            backgroundColor="background_secondary"
            p={1}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="border_primary"
            flexWrap="wrap"
        >
            {resolvedOptions.map((option) => {
                const isSelected = selectedPeriod === option.value;
                return (
                    <Button
                        unstyled
                        key={String(option.value)}
                        type="button"
                        onClick={() => {
                            if (!isDisabled) {
                                onSelectPeriod(option.value);
                            }
                        }}
                        disabled={isDisabled}
                        px={isSmall ? 2.5 : 3}
                        py={isSmall ? 0.5 : 1}
                        borderRadius="md"
                        fontSize="xs"
                        fontWeight={isSelected ? 700 : 500}
                        backgroundColor={isSelected ? "action_primary" : "transparent"}
                        color={isSelected ? "white" : "text_secondary"}
                        cursor={isDisabled ? "not-allowed" : "pointer"}
                        opacity={isDisabled ? 0.6 : 1}
                        transition="all 0.15s ease"
                        _hover={
                            isSelected || isDisabled
                                ? {}
                                : {
                                      color: "text_primary",
                                      backgroundColor: "background_primary",
                                  }
                        }
                    >
                        {option.label}
                    </Button>
                );
            })}
        </HStack>
    );
}

export default ChartPeriodSelector;
