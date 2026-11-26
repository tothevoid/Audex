import React, { useCallback, useMemo } from "react";
import { DatePicker as ChakraDatePicker } from "@chakra-ui/react";
import { CalendarDate, DateValue } from "@internationalized/date";
import { useTranslation } from "react-i18next";
import DatePickerCalendarContent from "./DatePickerCalendarContent";
import DatePickerControl from "./DatePickerControl";

export interface DatePickerProps {
    value?: Date | string | null;
    onChange?: (date: Date | null) => void;
    minDate?: Date | null;
    maxDate?: Date | null;
    isClearable?: boolean;
    inline?: boolean;
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
    inline = false,
    placeholder,
    size = "sm",
    width,
    maxW,
    fullWidth = true,
    disabled = false,
    name,
    id,
}) => {
    const { i18n } = useTranslation();

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
        onChange?.(nextDate);
    };

    return (
        <ChakraDatePicker.Root
            value={rootValues}
            onValueChange={handleValueChange}
            min={minDateValue}
            max={maxDateValue}
            locale={i18n.language}
            format={format}
            inline={inline}
            closeOnSelect={!inline}
            openOnClick={!inline}
            disabled={disabled}
            size={size}
            name={name}
            id={id}
            positioning={inline ? undefined : { placement: "bottom-start", sameWidth: false }}
            width={inline ? "auto" : fullWidth ? "100%" : width}
            maxW={maxW}
        >
            {!inline && (
                <DatePickerControl
                    placeholder={placeholder}
                    disabled={disabled}
                    isClearable={isClearable}
                    hasSelectedDate={Boolean(selectedDate)}
                />
            )}

            <DatePickerCalendarContent
                isClearable={isClearable}
                inline={inline}
                disabled={disabled}
                hasSelectedDate={Boolean(selectedDate)}
            />
        </ChakraDatePicker.Root>
    );
};

export default DatePicker;
