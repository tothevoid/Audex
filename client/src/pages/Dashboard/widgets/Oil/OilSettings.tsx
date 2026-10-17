import React, { useEffect, useState } from "react";
import { Field, Flex, Skeleton, Wrap } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { WidgetSettingsProps } from "../types";
import { OilWidgetSettings } from "@/models/dashboard/widgets/oil/OilWidgetEntity";
import { getOilSymbols } from "@/api/dashboard/widgets/oil/oilWidgetApi";
import { ChipGroup } from "@/shared/components/ChipGroup";

export const OilSettings: React.FC<WidgetSettingsProps<OilWidgetSettings>> = ({
    settings,
    updateSettings
}) => {
    const { t } = useTranslation();
    const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        getOilSymbols()
            .then((symbols) => {
                if (isMounted) {
                    setAvailableSymbols(symbols);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const selectedSymbols = settings.symbols ?? [];

    useEffect(() => {
        if (availableSymbols.length > 0 && (!settings.symbols || settings.symbols.length === 0)) {
            updateSettings({ symbols: availableSymbols });
        }
    }, [availableSymbols, settings.symbols, updateSettings]);

    const toggleSymbol = (symbol: string) => {
        const isSelected = selectedSymbols.includes(symbol);
        if (isSelected && selectedSymbols.length === 1) {
            return;
        }

        const nextSymbols = isSelected
            ? selectedSymbols.filter((item) => item !== symbol)
            : [...selectedSymbols, symbol];

        updateSettings({ symbols: nextSymbols });
    };

    return (
        <Field.Root>
            <Flex justify="space-between" align="center" mb={2}>
                <Field.Label mb={0}>{t("widget_oil_select_symbols")}</Field.Label>
            </Flex>

            {isLoading ? (
                <Wrap gap={2} mt={1}>
                    <Skeleton height="32px" width="70px" borderRadius="md" />
                    <Skeleton height="32px" width="70px" borderRadius="md" />
                </Wrap>
            ) : (
                <ChipGroup<string>
                    options={availableSymbols.map((symbol) => ({
                        value: symbol,
                        label: symbol
                    }))}
                    values={selectedSymbols}
                    isMulti
                    onToggle={toggleSymbol}
                    fontWeight="bold"
                />
            )}
        </Field.Root>
    );
};
