import React from "react";
import { useTranslation } from "react-i18next";
import FilterBlock from "@/shared/components/FilterBlock/FilterBlock";
import { FilterBarSearch } from "@/shared/components/FilterBar/FilterBar";

export const DATA_TABLE_MAX_HEIGHT = {
    base: "60dvh",
    lg: "calc(100dvh - 240px)",
};

export interface DataTableFilterBarProps {
    showSearch: boolean;
    searchText: string;
    onSearchTextChanged: (text: string) => void;
    showActiveFilter?: boolean;
    onlyActive?: boolean;
    onOnlyActiveChanged?: (onlyActive: boolean) => void;
}

export const DataTableFilterBar: React.FC<DataTableFilterBarProps> = ({
    showSearch,
    searchText,
    onSearchTextChanged,
    showActiveFilter = false,
    onlyActive = false,
    onOnlyActiveChanged,
}) => {
    const { t } = useTranslation();

    if (!showSearch && !showActiveFilter) {
        return null;
    }

    return (
        <FilterBlock>
            {showSearch && (
                <FilterBarSearch
                    searchText={searchText}
                    onSearchTextChanged={onSearchTextChanged}
                    placeholder={t("data_filter_search_placeholder")}
                />
            )}
            {showSearch && showActiveFilter && <FilterBlock.Divider />}
            {showActiveFilter && onOnlyActiveChanged && (
                <FilterBlock.Switch
                    active={onlyActive}
                    title={t("data_filter_only_active")}
                    onSwitch={onOnlyActiveChanged}
                />
            )}
        </FilterBlock>
    );
};

export default DataTableFilterBar;
