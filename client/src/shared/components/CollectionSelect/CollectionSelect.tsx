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
    isOptionVisible?: (item: T) => boolean;
    isClearable?: IsClearable;
    isSearchable?: boolean;
    maxRows?: number;
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
    isOptionVisible,
    isClearable = true as IsClearable,
    isSearchable = true,
    maxRows,
}: Props<T, TFieldValues, IsClearable>) => {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <BaseSelect<T, IsClearable>
                    placeholder={placeholder}
                    collection={collection}
                    selectedValue={field.value}
                    labelSelector={labelSelector}
                    valueSelector={valueSelector}
                    onSelected={(value) => field.onChange(value)}
                    isDisabled={isDisabled}
                    isOptionVisible={isOptionVisible}
                    isClearable={isClearable}
                    isSearchable={isSearchable}
                    maxRows={maxRows}
                />
            )}
        />
    );
};

export default CollectionSelect;