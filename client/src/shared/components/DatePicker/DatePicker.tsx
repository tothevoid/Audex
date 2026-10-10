import React, { useCallback, useMemo } from "react";
import {
    Button,
    DatePicker as ChakraDatePicker,
    Flex,
    IconButton,
    Portal,
} from "@chakra-ui/react";
import { CalendarDate, DateValue } from "@internationalized/date";
import { LuCalendar, LuX } from "react-icons/lu";
import { useTranslation } from "react-i18next";

export interface DatePickerProps {
    value?: Date | string | null;
    onChange?: (date: Date | null) => void;
    minDate?: Date | null;
    maxDate?: Date | null;
    isClearable?: boolean;
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
        onChange?.(new Date(firstDateValue.year, firstDateValue.month - 1, firstDateValue.day));
    };

    return (
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
            width={fullWidth ? "100%" : width}
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
};

export default DatePicker;
