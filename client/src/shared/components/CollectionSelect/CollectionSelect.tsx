import { Control, Controller, FieldValues, Path } from "react-hook-form";
import BaseSelect from "@/shared/components/BaseSelect/BaseSelect";

interface Props<T, TFieldValues extends FieldValues = FieldValues, IsClearable extends boolean = true> {
    name: Path<TFieldValues>;
    placeholder?: string;
    control: Control<TFieldValues>;
    collection: readonly T[] | T[];
    labelSelector: (item: T) => string;
    valueSelector: (item: T) => string | number;
    isDisabled?: boolean;
    isClearable?: IsClearable;
}

const CollectionSelect = <
    T,
    TFieldValues extends FieldValues = FieldValues,
    IsClearable extends boolean = true
>({
    name,
    placeholder,
    control,
    collection = [],
    labelSelector,
    valueSelector,
    isDisabled,
    isClearable = true as IsClearable,
}: Props<T, TFieldValues, IsClearable>) => {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const normalizedValue = (() => {
                    if (!field.value) return null;
                    const targetVal = typeof field.value === "object" ? String(valueSelector(field.value)) : String(field.value);
                    return collection.find((item) => String(valueSelector(item)) === targetVal) || field.value;
                })();

                return (
                    <BaseSelect<T, IsClearable>
                        placeholder={placeholder}
                        collection={collection}
                        selectedValue={normalizedValue}
                        labelSelector={labelSelector}
                        valueSelector={valueSelector}
                        onSelected={(value) => field.onChange(value)}
                        isDisabled={isDisabled}
                        isClearable={isClearable}
                    />
                );
            }}
        />
    );
};

export default CollectionSelect;