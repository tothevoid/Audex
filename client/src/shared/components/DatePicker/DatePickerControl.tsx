import React from "react";
import {
    DatePicker as ChakraDatePicker,
    IconButton,
} from "@chakra-ui/react";
import { LuCalendar, LuX } from "react-icons/lu";

export interface DatePickerControlProps {
    placeholder?: string;
    disabled: boolean;
    isClearable: boolean;
    hasSelectedDate: boolean;
}

export const DatePickerControl: React.FC<DatePickerControlProps> = ({
    placeholder,
    disabled,
    isClearable,
    hasSelectedDate,
}) => {
    return (
        <ChakraDatePicker.Control>
            <ChakraDatePicker.Input
                placeholder={placeholder}
                disabled={disabled}
                autoComplete="off"
            />
            {isClearable && hasSelectedDate && !disabled && (
                <ChakraDatePicker.ClearTrigger asChild>
                    <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label="Clear date"
                        color="text_secondary"
                        _hover={{ color: "text_primary" }}
                    >
                        <LuX size={14} />
                    </IconButton>
                </ChakraDatePicker.ClearTrigger>
            )}
            <ChakraDatePicker.Trigger asChild>
                <IconButton
                    size="xs"
                    variant="ghost"
                    disabled={disabled}
                    aria-label="Select date"
                    color="text_secondary"
                    _hover={{ color: "text_primary" }}
                >
                    <LuCalendar size={15} />
                </IconButton>
            </ChakraDatePicker.Trigger>
        </ChakraDatePicker.Control>
    );
};

export default DatePickerControl;
