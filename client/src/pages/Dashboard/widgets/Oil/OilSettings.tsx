import React from "react";
import { Box, Field, Flex, Text, Wrap } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuCheck } from "react-icons/lu";
import { WidgetSettingsProps } from "../types";
import { OilWidgetSettings } from "@/models/dashboard/widgets/oil/OilWidgetEntity";

interface OilOption {
    code: string;
    label: string;
}

const AvailableOilOptions: OilOption[] = [
    { code: "BRENT", label: "Brent" },
    { code: "WTI", label: "WTI" }
];

const DefaultOilSymbols = ["BRENT", "WTI"];

export const OilSettings: React.FC<WidgetSettingsProps<OilWidgetSettings>> = ({
    settings,
    updateSettings
}) => {
    const { t } = useTranslation();

    const selectedSymbols = settings.symbols && settings.symbols.length > 0
        ? settings.symbols
        : DefaultOilSymbols;

    const toggleSymbol = (code: string) => {
        const isSelected = selectedSymbols.includes(code);
        let nextSymbols: string[];

        if (isSelected) {
            if (selectedSymbols.length <= 1) return;
            nextSymbols = selectedSymbols.filter((s) => s !== code);
        } else {
            nextSymbols = [...selectedSymbols, code];
        }

        updateSettings({ symbols: nextSymbols });
    };

    return (
        <Field.Root>
            <Flex justify="space-between" align="center" mb={2}>
                <Field.Label mb={0}>{t("widget_oil_select_symbols")}</Field.Label>
            </Flex>

            <Wrap gap={2} mt={1}>
                {AvailableOilOptions.map((option) => {
                    const isSelected = selectedSymbols.includes(option.code);
                    return (
                        <Box
                            key={option.code}
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
                            onClick={() => toggleSymbol(option.code)}
                            _hover={{
                                borderColor: "action_primary",
                                opacity: isSelected ? 0.9 : 1
                            }}
                        >
                            {isSelected && <LuCheck size={12} />}
                            <Text fontWeight="bold">{option.label}</Text>
                        </Box>
                    );
                })}
            </Wrap>
        </Field.Root>
    );
};
