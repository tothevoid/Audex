import "./DateSelect.scss";
import DatePicker from "react-datepicker";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import DateInput from "../DateInput/DateInput";

interface Props<TFieldValues extends FieldValues> {
    name: Path<TFieldValues>;
    control: Control<TFieldValues>;
    fullWidth?: boolean;
    isDateTime?: boolean;
}

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
                    customInput={<DateInput />}
                />
            )}
        />
    );
};

export default DateSelect;