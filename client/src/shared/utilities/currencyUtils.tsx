import React from "react";
import { Text } from "@chakra-ui/react";

/**
 * Resolves the official narrow currency symbol (₽, $, €) via Intl standard.
 */
export const getCurrencySymbol = (currencyCode: string, locale: string = "ru-RU"): string => {
    if (!currencyCode) {
        return "";
    }

    try {
        const parts = new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currencyCode,
            currencyDisplay: "narrowSymbol",
        }).formatToParts(0);

        return parts.find((p) => p.type === "currency")?.value || currencyCode;
    } catch {
        return currencyCode;
    }
};

/**
 * Deterministically generates a harmonious color palette for any currency code across themes.
 */
export const getCurrencyColor = (
    currencyName: string,
    theme: 'light' | 'dark' = 'dark'
): { iconBg: string; iconColor: string } => {
    const code = currencyName?.trim().toUpperCase() || "";

    let hash = 0;
    for (let i = 0; i < code.length; i++) {
        hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;

    if (theme === 'light') {
        // Light Theme: Deep, rich, readable colors with gentle tint (never neon)
        const maxLightness = (hue >= 35 && hue <= 165) ? 24 : 32;
        return {
            iconBg: `hsla(${hue}, 45%, 45%, 0.12)`,
            iconColor: `hsl(${hue}, 70%, ${maxLightness}%)`,
        };
    } else {
        // Dark Theme
        return {
            iconBg: `hsla(${hue}, 65%, 45%, 0.15)`,
            iconColor: `hsl(${hue}, 80%, 65%)`,
        };
    }
};

/**
 * Renders a stylized typography currency symbol badge.
 */
export const getCurrencyIcon = (
    currencyName: string,
    locale: string = "ru-RU",
    fontSize: string = "18px",
    fontWeight: number | string = 600
): React.ReactNode => {
    const symbol = getCurrencySymbol(currencyName, locale);

    return (
        <Text fontSize={fontSize} fontWeight={fontWeight} lineHeight={1} userSelect="none">
            {symbol}
        </Text>
    );
};
