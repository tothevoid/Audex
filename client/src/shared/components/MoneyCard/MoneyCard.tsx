import React from "react";
import StatsCard from "@/shared/components/StatsCard/StatsCard";
import { formatMoneyByCurrencyCulture } from "@/shared/utilities/formatters/moneyFormatter";
import { Nullable } from "@/shared/utilities/nullable";

export interface MoneyCardProps {
    title: string;
    value: number;
    currency?: string;
    color?: Nullable<string>;
    icon?: React.ReactNode;
    iconBg?: string;
    iconColor?: string;
    isHoverable?: boolean;
    prefix?: string;
}

const MoneyCard: React.FC<MoneyCardProps> = ({
    title,
    value,
    currency = "",
    color,
    icon,
    iconBg,
    iconColor,
    isHoverable = true,
    prefix = "",
}) => {
    const formatted = formatMoneyByCurrencyCulture(value, currency);
    const displayValue = prefix ? `${prefix}${formatted}` : formatted;

    return (
        <StatsCard
            title={title}
            value={displayValue}
            color={color}
            icon={icon}
            iconBg={iconBg}
            iconColor={iconColor}
            isHoverable={isHoverable}
        />
    );
};

export default MoneyCard;