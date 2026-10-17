import React, { useEffect, useState } from "react";
import { Field, Flex, Skeleton, Wrap } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { WidgetSettingsProps } from "../types";
import { IndicesWidgetSettings } from "@/models/dashboard/widgets/indices/IndicesWidgetEntity";
import { getSupportedIndices } from "@/api/dashboard/widgets/indices/indicesWidgetApi";
import { ChipGroup } from "@/shared/components/ChipGroup";

export const IndicesSettings: React.FC<WidgetSettingsProps<IndicesWidgetSettings>> = ({
    settings,
    updateSettings
}) => {
    const { t } = useTranslation();
    const [availableCodes, setAvailableCodes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        getSupportedIndices()
            .then((codes) => {
                if (isMounted) {
                    setAvailableCodes(codes);
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

    const selectedCodes = settings.codes ?? [];

    useEffect(() => {
        if (availableCodes.length > 0 && (!settings.codes || settings.codes.length === 0)) {
            updateSettings({ codes: availableCodes });
        }
    }, [availableCodes, settings.codes, updateSettings]);

    const toggleCode = (code: string) => {
        const isSelected = selectedCodes.includes(code);
        if (isSelected && selectedCodes.length === 1) {
            return;
        }

        const nextCodes = isSelected
            ? selectedCodes.filter((item) => item !== code)
            : [...selectedCodes, code];

        updateSettings({ codes: nextCodes });
    };

    return (
        <Field.Root>
            <Flex justify="space-between" align="center" mb={2}>
                <Field.Label mb={0}>{t("widget_indices_select_codes")}</Field.Label>
            </Flex>

            {isLoading ? (
                <Wrap gap={2} mt={1}>
                    <Skeleton height="32px" width="70px" borderRadius="md" />
                    <Skeleton height="32px" width="70px" borderRadius="md" />
                    <Skeleton height="32px" width="70px" borderRadius="md" />
                    <Skeleton height="32px" width="70px" borderRadius="md" />
                </Wrap>
            ) : (
                <ChipGroup<string>
                    options={availableCodes.map((code) => ({
                        value: code,
                        label: code
                    }))}
                    values={selectedCodes}
                    isMulti
                    onToggle={toggleCode}
                    fontWeight="bold"
                />
            )}
        </Field.Root>
    );
};
