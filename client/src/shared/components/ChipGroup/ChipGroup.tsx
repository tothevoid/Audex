import React from "react";
import { Box, Text, Wrap } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";

export interface ChipGroupOption<TOptionValue> {
    value: TOptionValue;
    label: string;
}

export interface ChipGroupProps<TOptionValue> {
    options: ChipGroupOption<TOptionValue>[];
    value?: TOptionValue;
    values?: TOptionValue[];
    isMulti?: boolean;
    onChange?: (value: TOptionValue) => void;
    onToggle?: (value: TOptionValue) => void;
    gap?: number | string;
    fontWeight?: "medium" | "semibold" | "bold";
    fontSize?: "2xs" | "xs" | "sm";
}

export const ChipGroup = <TOptionValue,>({
    options,
    value,
    values,
    isMulti = false,
    onChange,
    onToggle,
    gap = 2,
    fontWeight = "semibold",
    fontSize = "xs"
}: ChipGroupProps<TOptionValue>) => {
    return (
        <Wrap gap={gap} mt={1}>
            {options.map((option) => {
                const isSelected = isMulti
                    ? (values?.includes(option.value) ?? false)
                    : option.value === value;

                const handleOptionClick = () => {
                    if (isMulti) {
                        onToggle?.(option.value);
                    } else {
                        onChange?.(option.value);
                    }
                };

                return (
                    <Box
                        key={String(option.value ?? "empty_option")}
                        px={3}
                        py={1.5}
                        borderRadius="md"
                        cursor="pointer"
                        borderWidth="1px"
                        borderColor={isSelected ? "action_primary" : "border_primary"}
                        backgroundColor={isSelected ? "action_primary" : "background_secondary"}
                        color={isSelected ? "white" : "text_primary"}
                        fontSize={fontSize}
                        fontWeight="medium"
                        display="flex"
                        alignItems="center"
                        gap={1.5}
                        transition="all 0.15s ease"
                        onClick={handleOptionClick}
                        _hover={{
                            borderColor: "action_primary",
                            opacity: isSelected ? 0.9 : 1
                        }}
                    >
                        {isSelected && <LuCheck size={12} />}
                        <Text fontWeight={fontWeight}>{option.label}</Text>
                    </Box>
                );
            })}
        </Wrap>
    );
};

export default ChipGroup;
