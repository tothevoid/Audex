import { Control, Controller, FieldValues, Path } from "react-hook-form";
import DatePicker from "@/shared/components/DatePicker/DatePicker";

interface Props<TFieldValues extends FieldValues> {
    name: Path<TFieldValues>;
    control: Control<TFieldValues>;
    fullWidth?: boolean;
    isDateTime?: boolean;
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
            render={({ field: { onChange, value } }) => (
                <DatePicker
                    name={name}
                    value={value}
                    onChange={onChange}
                    fullWidth={fullWidth}
                    disabled={disabled}
                    minDate={minDate}
                    maxDate={maxDate}
                    isClearable={isClearable}
                    placeholder={placeholder}
                    size={size}
                />
            )}
        />
    );
};

export default DateSelect;