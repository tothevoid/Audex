import React, { useMemo } from "react";
import { Box, HStack } from "@chakra-ui/react";
import TimeInput from "@/shared/components/TimeInput/TimeInput";
import DatePicker, { DatePickerProps } from "./DatePicker";

export interface DateTimePickerProps extends Omit<DatePickerProps, "inline"> {
    showSeconds?: boolean;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
    value,
    onChange,
    showSeconds = true,
    size = "sm",
    width,
    maxW,
    fullWidth = true,
    disabled = false,
    ...datePickerProps
}) => {
    const selectedDate = useMemo(() => {
        if (!value) return null;
        const parsedDate = value instanceof Date ? value : new Date(value);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }, [value]);

    const handleDateChange = (nextDate: Date | null) => {
        if (!nextDate) {
            onChange?.(null);
            return;
        }

        const timeSource = selectedDate ?? new Date();
        nextDate.setHours(
            timeSource.getHours(),
            timeSource.getMinutes(),
            timeSource.getSeconds(),
            timeSource.getMilliseconds()
        );
        onChange?.(nextDate);
    };

    const handleTimeChange = (timeString: string) => {
        if (!timeString) {
            return;
        }

        const baseDate = selectedDate ? new Date(selectedDate) : new Date();
        const timeSegments = timeString.split(":").map(Number);
        const hours = timeSegments[0] ?? 0;
        const minutes = timeSegments[1] ?? 0;
        const seconds = timeSegments[2] ?? 0;

        baseDate.setHours(hours, minutes, seconds, 0);
        onChange?.(baseDate);
    };

    const timeValue = useMemo(() => {
        if (!selectedDate) {
            return "";
        }
        const hours = String(selectedDate.getHours()).padStart(2, "0");
        const minutes = String(selectedDate.getMinutes()).padStart(2, "0");
        const seconds = String(selectedDate.getSeconds()).padStart(2, "0");
        return showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
    }, [selectedDate, showSeconds]);

    const timeInputWidth = showSeconds ? "125px" : "100px";

    return (
        <HStack gap={2} width={fullWidth ? "100%" : width} maxW={maxW} align="center">
            <Box flex={1} minW={0}>
                <DatePicker
                    {...datePickerProps}
                    value={value}
                    onChange={handleDateChange}
                    size={size}
                    fullWidth={true}
                    disabled={disabled}
                />
            </Box>
            <TimeInput
                value={timeValue}
                onChange={handleTimeChange}
                disabled={disabled}
                size={size}
                step={showSeconds ? "1" : undefined}
                width={timeInputWidth}
                minW={timeInputWidth}
                maxW={timeInputWidth}
            />
        </HStack>
    );
};

export default DateTimePicker;
