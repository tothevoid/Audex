import React, { useCallback, useMemo } from "react";
import {
    Box,
    Button,
    DatePicker as ChakraDatePicker,
    Flex,
    HStack,
    IconButton,
    Portal,
} from "@chakra-ui/react";
import { CalendarDate, DateValue } from "@internationalized/date";
import { LuCalendar, LuX } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import TimeInput from "@/shared/components/TimeInput/TimeInput";

export interface DatePickerProps {
    value?: Date | string | null;
    onChange?: (date: Date | null) => void;
    minDate?: Date | null;
    maxDate?: Date | null;
    isClearable?: boolean;
    isDateTime?: boolean;
    showSeconds?: boolean;
    placeholder?: string;
    size?: "xs" | "sm" | "md" | "lg";
    width?: string | number | object;
    maxW?: string | number | object;
    fullWidth?: boolean;
    disabled?: boolean;
    name?: string;
    id?: string;
}

const toDateValue = (date: Date | string | null | undefined): DateValue | null => {
    if (!date) return null;
    const parsedDate = date instanceof Date ? date : new Date(date);
    if (isNaN(parsedDate.getTime())) return null;
    return new CalendarDate(parsedDate.getFullYear(), parsedDate.getMonth() + 1, parsedDate.getDate());
};

export const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
    minDate,
    maxDate,
    isClearable = false,
    isDateTime = false,
    showSeconds = true,
    placeholder,
    size = "sm",
    width,
    maxW,
    fullWidth = true,
    disabled = false,
    name,
    id,
}) => {
    const { t, i18n } = useTranslation();

    const selectedDate = useMemo(() => {
        if (!value) return null;
        const parsedDate = value instanceof Date ? value : new Date(value);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }, [value]);

    const dateValue = useMemo(() => toDateValue(selectedDate), [selectedDate]);
    const rootValues = useMemo(() => (dateValue ? [dateValue] : []), [dateValue]);

    const minDateValue = useMemo(() => toDateValue(minDate) ?? undefined, [minDate]);
    const maxDateValue = useMemo(() => toDateValue(maxDate) ?? undefined, [maxDate]);

    const format = useCallback(
        (targetDateValue: DateValue) => {
            const nativeDate = new Date(targetDateValue.year, targetDateValue.month - 1, targetDateValue.day);
            return new Intl.DateTimeFormat(i18n.language).format(nativeDate);
        },
        [i18n.language]
    );

    const handleValueChange = (details: { value: DateValue[] }) => {
        if (!details.value || details.value.length === 0) {
            onChange?.(null);
            return;
        }

        const firstDateValue = details.value[0];
        const nextDate = new Date(firstDateValue.year, firstDateValue.month - 1, firstDateValue.day);

        if (isDateTime) {
            const timeSource = selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : new Date();
            nextDate.setHours(
                timeSource.getHours(),
                timeSource.getMinutes(),
                timeSource.getSeconds(),
                timeSource.getMilliseconds()
            );
        }

        onChange?.(nextDate);
    };

    const handleTimeChange = (timeString: string) => {
        if (!timeString) {
            return;
        }

        const baseDate = selectedDate && !isNaN(selectedDate.getTime()) ? new Date(selectedDate) : new Date();
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

    const datePickerRoot = (
        <ChakraDatePicker.Root
            value={rootValues}
            onValueChange={handleValueChange}
            min={minDateValue}
            max={maxDateValue}
            locale={i18n.language}
            format={format}
            closeOnSelect={true}
            openOnClick={true}
            disabled={disabled}
            size={size}
            name={name}
            id={id}
            positioning={{ placement: "bottom-start", sameWidth: false }}
            width={fullWidth && !isDateTime ? "100%" : width}
            maxW={maxW}
        >
            <ChakraDatePicker.Control>
                <ChakraDatePicker.Input
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete="off"
                />
                {isClearable && selectedDate && !disabled && (
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

            <Portal>
                <ChakraDatePicker.Positioner zIndex="popover">
                    <ChakraDatePicker.Content
                        backgroundColor="background_primary"
                        borderColor="border_primary"
                    >
                        <ChakraDatePicker.View view="day">
                            <ChakraDatePicker.Header />
                            <ChakraDatePicker.DayTable />
                        </ChakraDatePicker.View>
                        <ChakraDatePicker.View view="month">
                            <ChakraDatePicker.Header />
                            <ChakraDatePicker.MonthTable />
                        </ChakraDatePicker.View>
                        <ChakraDatePicker.View view="year">
                            <ChakraDatePicker.Header />
                            <ChakraDatePicker.YearTable />
                        </ChakraDatePicker.View>

                        <ChakraDatePicker.Context>
                            {(datePicker) => (
                                <Flex
                                    justify="space-between"
                                    align="center"
                                    pt={2}
                                    mt={2}
                                    borderTopWidth="1px"
                                    borderColor="border_primary"
                                >
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        color="text_secondary"
                                        _hover={{ color: "loss", bg: "background_secondary" }}
                                        disabled={!selectedDate || disabled}
                                        onClick={() => {
                                            datePicker.clearValue();
                                            datePicker.setOpen(false);
                                        }}
                                    >
                                        {t("date_picker_reset")}
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        color="action_primary"
                                        _hover={{ bg: "background_secondary" }}
                                        onClick={() => {
                                            datePicker.selectToday();
                                            datePicker.setOpen(false);
                                        }}
                                    >
                                        {t("date_picker_today")}
                                    </Button>
                                </Flex>
                            )}
                        </ChakraDatePicker.Context>
                    </ChakraDatePicker.Content>
                </ChakraDatePicker.Positioner>
            </Portal>
        </ChakraDatePicker.Root>
    );

    if (!isDateTime) {
        return datePickerRoot;
    }

    const timeInputWidth = showSeconds ? "125px" : "100px";

    return (
        <HStack gap={2} width={fullWidth ? "100%" : width} maxW={maxW} align="center">
            <Box flex={1} minW={0}>
                {datePickerRoot}
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

export default DatePicker;
