import React from "react";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { BaseMetricItem, BaseMetricItemProps } from "./BaseMetricItem";

export interface NumericMetricItemProps extends Omit<BaseMetricItemProps, "value"> {
    value?: number | null;
    currency?: string | null;
    isPnl?: boolean;
}

const formatDisplayValue = (value?: number | null, currency?: string | null, isPnl?: boolean): string => {
    if (value == null) return "—";
    if (!currency) return String(value);

    if (isPnl) {
        const sign = value > 0 ? "+" : value < 0 ? "-" : "";
        return `${sign}${formatMoneyByCurrencyCulture(Math.abs(value), currency)}`;
    }

    return formatMoneyByCurrencyCulture(value, currency);
};

const resolveValueColor = (value?: number | null, isPnl?: boolean, customColor?: string): string => {
    if (customColor) return customColor;
    if (!isPnl || !value) return "text_primary";
    return value > 0 ? "pnl_positive" : "pnl_negative";
};

export const NumericMetricItem: React.FC<NumericMetricItemProps> = ({
    value,
    currency,
    isPnl = false,
    valueColor,
    ...baseProps
}) => {
    return (
        <BaseMetricItem
            {...baseProps}
            value={formatDisplayValue(value, currency, isPnl)}
            valueColor={resolveValueColor(value, isPnl, valueColor)}
        />
    );
};

export default NumericMetricItem;
