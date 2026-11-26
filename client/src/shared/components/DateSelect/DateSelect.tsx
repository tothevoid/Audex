import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { DatePicker, DatePickerProps, DateTimePicker } from "@/shared/components/DatePicker";

interface Props<TFieldValues extends FieldValues> {
    name: Path<TFieldValues>;
    control: Control<TFieldValues>;
    fullWidth?: boolean;
    isDateTime?: boolean;
    showSeconds?: boolean;
    disabled?: boolean;
    minDate?: Date | null;
    maxDate?: Date | null;
    isClearable?: boolean;
    placeholder?: string;
    size?: "xs" | "sm" | "md" | "lg";
}

const DateSelect = <TFieldValues extends FieldValues>({
    name,
    control,
    fullWidth = true,
    isDateTime = false,
    showSeconds = true,
    disabled = false,
    minDate,
    maxDate,
    isClearable = false,
    placeholder,
    size = "sm",
}: Props<TFieldValues>) => {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value } }) => {
                const sharedProps: Omit<DatePickerProps, "inline"> = {
                    name,
                    value,
                    onChange,
                    fullWidth,
                    disabled,
                    minDate,
                    maxDate,
                    isClearable,
                    placeholder,
                    size,
                };

                return isDateTime ? (
                    <DateTimePicker {...sharedProps} showSeconds={showSeconds} />
                ) : (
                    <DatePicker {...sharedProps} />
                );
            }}
        />
    );
};

export default DateSelect;