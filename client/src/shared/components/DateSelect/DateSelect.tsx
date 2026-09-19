import React from "react";
import "./DateSelect.scss";
import { Input } from "@chakra-ui/react";
import DatePicker from "react-datepicker";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface Props<TFieldValues extends FieldValues> {
    name: Path<TFieldValues>;
    control: Control<TFieldValues>;
    fullWidth?: boolean;
    isDateTime?: boolean;
}

const CustomDateInput = React.forwardRef<HTMLInputElement, any>(({ value, onClick, onChange, placeholder }, ref) => (
    <Input
        ref={ref}
        value={value ?? ''}
        onClick={onClick}
        onChange={onChange}
        placeholder={placeholder || 'dd.mm.yyyy'}
        size="sm"
        backgroundColor="background_primary"
        borderColor="border_primary"
        color="text_primary"
        autoComplete="off"
    />
));
CustomDateInput.displayName = "CustomDateInput";

const DateSelect = <TFieldValues extends FieldValues>({
    name,
    control,
    fullWidth = true,
    isDateTime = false
}: Props<TFieldValues>) => {
    const format = isDateTime ? "dd.MM.yyyy HH:mm:ss" : "dd.MM.yyyy";

    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value } }) => (
                <DatePicker
                    autoComplete="off"
                    showTimeSelect={isDateTime}
                    wrapperClassName={fullWidth ? "date-select-full-with" : undefined}
                    selected={value ? new Date(value) : new Date()}
                    onChange={onChange}
                    dateFormat={format}
                    customInput={<CustomDateInput />}
                />
            )}
        />
    );
};

export default DateSelect;