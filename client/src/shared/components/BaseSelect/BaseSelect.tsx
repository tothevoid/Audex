import { ChakraStylesConfig, Select } from "chakra-react-select";
import { useMemo } from "react";

const DEFAULT_MAX_VISIBLE_ROWS = 7;
const OPTION_ROW_HEIGHT = 36;
const MENU_VERTICAL_PADDING = 8;

export type ValueType<T, IsClearable extends boolean> = IsClearable extends true ? T | null : T;

export interface BaseSelectProps<T, IsClearable extends boolean = false> {
    placeholder?: string;
    collection: readonly T[] | T[];
    selectedValue?: T | null | undefined;
    labelSelector: (item: T) => string;
    valueSelector: (item: T) => string | number;
    onSelected: (item: ValueType<T, IsClearable>) => void;
    isDisabled?: boolean;
    isClearable?: IsClearable;
    isSearchable?: boolean;
    maxRows?: number;
}

const defaultSelectChakraStyles: ChakraStylesConfig = {
    control: (provided, state) => ({
        ...provided,
        backgroundColor: state.isDisabled ? "background_secondary" : "background_primary",
        borderColor: "border_primary",
        color: state.isDisabled ? "text_secondary" : "text_primary",
        opacity: state.isDisabled ? 0.7 : 1,
        cursor: state.isDisabled ? "not-allowed" : "default",
        _hover: {
            borderColor: "border_primary",
        },
    }),
    input: (provided) => ({
        ...provided,
        color: "text_primary",
    }),
    option: (provided, state) => ({
        ...provided,
        minHeight: `${OPTION_ROW_HEIGHT}px`,
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        color: state.isSelected ? "white" : "text_primary",
        backgroundColor: state.isSelected
            ? "action_primary"
            : state.isFocused
                ? "background_secondary"
                : "background_primary",
    }),
    singleValue: (provided, state) => ({
        ...provided,
        color: state.isDisabled ? "text_secondary" : "text_primary",
    }),
    menu: (provided) => ({
        ...provided,
        zIndex: 20,
    }),
    menuList: (provided) => ({
        ...provided,
        backgroundColor: "background_primary",
        borderColor: "border_primary",
        boxShadow: "lg",
        borderRadius: "8px",
        maxHeight: `${DEFAULT_MAX_VISIBLE_ROWS * OPTION_ROW_HEIGHT + MENU_VERTICAL_PADDING}px`,
        zIndex: 20,
    }),
    placeholder: (provided) => ({
        ...provided,
        color: "gray.500",
    }),
};

const BaseSelect = <T, IsClearable extends boolean = false>({
    placeholder,
    selectedValue,
    onSelected,
    collection = [],
    labelSelector,
    valueSelector,
    isDisabled,
    isClearable = false as IsClearable,
    isSearchable = true,
    maxRows = DEFAULT_MAX_VISIBLE_ROWS,
}: BaseSelectProps<T, IsClearable>) => {
    const chakraStyles = useMemo(() => {
        if (maxRows === DEFAULT_MAX_VISIBLE_ROWS) {
            return defaultSelectChakraStyles;
        }

        return {
            ...defaultSelectChakraStyles,
            menuList: (provided, state) => ({
                ...(defaultSelectChakraStyles.menuList?.(provided, state) ?? provided),
                maxHeight: `${maxRows * OPTION_ROW_HEIGHT + MENU_VERTICAL_PADDING}px`,
            }),
        };
    }, [maxRows]);

    return (
        <Select<T, false>
            isDisabled={isDisabled}
            isSearchable={isSearchable}
            chakraStyles={chakraStyles as ChakraStylesConfig<T, false>}
            getOptionLabel={labelSelector}
            getOptionValue={(item) => String(valueSelector(item))}
            options={collection as T[]}
            value={selectedValue}
            isClearable={isClearable}
            onChange={(option) => onSelected(option as ValueType<T, IsClearable>)}
            placeholder={placeholder ?? ""}
        />
    );
};

export default BaseSelect;



