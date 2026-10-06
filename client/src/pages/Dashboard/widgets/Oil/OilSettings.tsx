import React, { useEffect, useState } from "react";
import { Box, Field, Flex, Skeleton, Text, Wrap } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuCheck } from "react-icons/lu";
import { WidgetSettingsProps } from "../types";
import { OilWidgetSettings } from "@/models/dashboard/widgets/oil/OilWidgetEntity";
import { getOilSymbols } from "@/api/dashboard/widgets/oil/oilWidgetApi";

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
                <Wrap gap={2} mt={1}>
                    {availableSymbols.map((symbol) => {
                        const isSelected = selectedSymbols.includes(symbol);
                        return (
                            <Box
                                key={symbol}
                                px={3}
                                py={1.5}
                                borderRadius="md"
                                cursor="pointer"
                                borderWidth="1px"
                                borderColor={isSelected ? "action_primary" : "border_primary"}
                                backgroundColor={isSelected ? "action_primary" : "background_secondary"}
                                color={isSelected ? "white" : "text_primary"}
                                fontSize="xs"
                                fontWeight="medium"
                                display="flex"
                                alignItems="center"
                                gap={1.5}
                                transition="all 0.15s ease"
                                onClick={() => toggleSymbol(symbol)}
                                _hover={{
                                    borderColor: "action_primary",
                                    opacity: isSelected ? 0.9 : 1
                                }}
                            >
                                {isSelected && <LuCheck size={12} />}
                                <Text fontWeight="bold">{symbol}</Text>
                            </Box>
                        );
                    })}
                </Wrap>
            )}
        </Field.Root>
    );
};
