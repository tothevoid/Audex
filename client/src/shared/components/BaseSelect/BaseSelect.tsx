import { ChakraStylesConfig, Select, SizeProp } from "chakra-react-select";
import { createFilter } from "react-select";
import { SystemStyleObject } from "@chakra-ui/react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

const DEFAULT_MAX_VISIBLE_ROWS = 7;
const OPTION_ROW_HEIGHT = 36;
const MENU_VERTICAL_PADDING = 8;

export type ValueType<T, IsClearable extends boolean> = IsClearable extends true ? T | null : T;

export interface BaseSelectProps<T, IsClearable extends boolean = false> {
    placeholder?: string;
    collection: readonly T[] | T[];
    selectedValue?: T | string | number | null | undefined;
    labelSelector: (item: T) => string;
    valueSelector: (item: T) => string | number;
    onSelected: (item: ValueType<T, IsClearable>) => void;
    isDisabled?: boolean;
    isOptionVisible?: (item: T) => boolean;
    isClearable?: IsClearable;
    isSearchable?: boolean;
    maxRows?: number;
    size?: SizeProp;
    menuPosition?: "absolute" | "fixed";
    menuPortalTarget?: HTMLElement | null;
    chakraStyles?: ChakraStylesConfig;
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
        cursor: state.isDisabled ? "not-allowed" : "pointer",
        opacity: state.isDisabled ? 0.45 : 1,
        color: state.isDisabled
            ? "text_secondary"
            : state.isSelected
                ? "white"
                : "text_primary",
        backgroundColor: state.isDisabled
            ? "transparent"
            : state.isSelected
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
    isOptionVisible,
    isClearable = false as IsClearable,
    isSearchable = true,
    maxRows = DEFAULT_MAX_VISIBLE_ROWS,
    size = "md",
    menuPosition,
    menuPortalTarget,
    chakraStyles: customChakraStyles,
}: BaseSelectProps<T, IsClearable>) => {
    const { t } = useTranslation();

    const chakraStyles = useMemo(() => {
        const baseMenuListHeight = `${maxRows * OPTION_ROW_HEIGHT + MENU_VERTICAL_PADDING}px`;

        if (!customChakraStyles && maxRows === DEFAULT_MAX_VISIBLE_ROWS) {
            return defaultSelectChakraStyles;
        }

        return {
            ...defaultSelectChakraStyles,
            ...customChakraStyles,
            menuList: (provided: SystemStyleObject, state: unknown) => {
                const defaultStyles = defaultSelectChakraStyles.menuList?.(provided, state as never) ?? provided;
                const customStyles = customChakraStyles?.menuList?.(provided, state as never) ?? {};
                return {
                    ...defaultStyles,
                    ...customStyles,
                    maxHeight: baseMenuListHeight,
                };
            },
        };
    }, [maxRows, customChakraStyles]);

    const resolvedSelectedValue = useMemo(() => {
        if (selectedValue === null || selectedValue === undefined || selectedValue === "") {
            return null;
        }

        const targetValue =
            typeof selectedValue === "object"
                ? String(valueSelector(selectedValue as T))
                : String(selectedValue);

        return collection.find((item) => String(valueSelector(item)) === targetValue) ?? null;
    }, [collection, selectedValue, valueSelector]);

    const reactSelectFilter = useMemo(() => {
        const defaultFilter = createFilter<T>();

        return (candidate: { data: T; label: string; value: string }, rawInput: string) => {
            if (isOptionVisible && !isOptionVisible(candidate.data)) {
                return false;
            }
            return defaultFilter(candidate, rawInput);
        };
    }, [isOptionVisible]);

    const resolvedLabelSelector = useCallback((item: T): string => {
        const baseLabel = labelSelector(item);
        if (isOptionVisible && !isOptionVisible(item)) {
            return `${baseLabel} (${t("entity_account_inactive_suffix")})`;
        }
        return baseLabel;
    }, [labelSelector, isOptionVisible, t]);

    return (
        <Select<T, false>
            size={size}
            isDisabled={isDisabled}
            filterOption={reactSelectFilter}
            isSearchable={isSearchable}
            chakraStyles={chakraStyles as ChakraStylesConfig<T, false>}
            getOptionLabel={resolvedLabelSelector}
            getOptionValue={(item) => String(valueSelector(item))}
            options={collection as T[]}
            value={resolvedSelectedValue}
            isClearable={isClearable}
            onChange={(option) => onSelected(option as ValueType<T, IsClearable>)}
            placeholder={placeholder ?? ""}
            menuPosition={menuPosition}
            menuPortalTarget={menuPortalTarget}
        />
    );
};

export default BaseSelect;
