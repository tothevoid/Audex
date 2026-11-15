import React from "react";
import { Text } from "@chakra-ui/react";
import { WorldCurrencyDescriptor } from "@/models/currencies/WorldCurrencyDescriptor";

export type { WorldCurrencyDescriptor };

let cachedSymbolsLocale: string | null = null;
const currencySymbolCache = new Map<string, string>();

let cachedDisplayNamesLocale: string | null = null;
let cachedDisplayNamesInstance: Intl.DisplayNames | null = null;

let cachedWorldCurrenciesLocale: string | null = null;
let cachedWorldCurrencies: readonly WorldCurrencyDescriptor[] | null = null;

/**
 * Resolves the official narrow currency symbol (₽, $, €) via Intl standard.
 */
export const getCurrencySymbol = (currencyCode: string, locale: string = "ru-RU"): string => {
    if (!currencyCode) {
        return "";
    }

    if (cachedSymbolsLocale !== locale) {
        currencySymbolCache.clear();
        cachedSymbolsLocale = locale;
    }

    const cachedSymbol = currencySymbolCache.get(currencyCode);
    if (cachedSymbol !== undefined) {
        return cachedSymbol;
    }

    try {
        const parts = new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currencyCode,
            currencyDisplay: "narrowSymbol",
        }).formatToParts(0);

        const resolvedSymbol = parts.find((part) => part.type === "currency")?.value || currencyCode;
        currencySymbolCache.set(currencyCode, resolvedSymbol);
        return resolvedSymbol;
    } catch {
        currencySymbolCache.set(currencyCode, currencyCode);
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
    for (let charIndex = 0; charIndex < code.length; charIndex++) {
        hash = code.charCodeAt(charIndex) + ((hash << 5) - hash);
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

const getDisplayNamesInstance = (locale: string): Intl.DisplayNames | null => {
    if (cachedDisplayNamesLocale === locale && cachedDisplayNamesInstance) {
        return cachedDisplayNamesInstance;
    }

    try {
        cachedDisplayNamesInstance = new Intl.DisplayNames([locale], { type: "currency" });
        cachedDisplayNamesLocale = locale;
        return cachedDisplayNamesInstance;
    } catch {
        cachedDisplayNamesLocale = null;
        cachedDisplayNamesInstance = null;
        return null;
    }
};

export const getCurrencyDisplayName = (currencyCode: string, locale: string = "en"): string => {
    if (!currencyCode) {
        return "";
    }

    try {
        const displayNames = getDisplayNamesInstance(locale);
        const localizedName = displayNames?.of(currencyCode);
        if (localizedName && localizedName.toLowerCase() !== currencyCode.toLowerCase()) {
            return localizedName.charAt(0).toUpperCase() + localizedName.slice(1);
        }
    } catch {
        // Fallback to currency code if Intl fails
    }

    return currencyCode;
};


export const getAvailableWorldCurrencies = (locale: string = "en"): readonly WorldCurrencyDescriptor[] => {
    if (cachedWorldCurrenciesLocale === locale && cachedWorldCurrencies) {
        return cachedWorldCurrencies;
    }

    let supportedCurrencies: string[];

    try {
        supportedCurrencies = Intl.supportedValuesOf("currency");
    } catch {
        supportedCurrencies = [];
    }

    const generatedCurrencies: WorldCurrencyDescriptor[] = supportedCurrencies.map((currencyCode) => {
        const name = getCurrencyDisplayName(currencyCode, locale);
        const symbol = getCurrencySymbol(currencyCode, locale);
        const hasDistinctSymbol = Boolean(symbol && symbol !== currencyCode);
        const label = `${currencyCode} — ${name}${hasDistinctSymbol ? ` (${symbol})` : ""}`;

        return {
            code: currencyCode,
            name,
            symbol,
            label,
        };
    });

    cachedWorldCurrencies = generatedCurrencies;
    cachedWorldCurrenciesLocale = locale;
    return generatedCurrencies;
};

