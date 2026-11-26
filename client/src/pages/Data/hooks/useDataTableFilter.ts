import { useMemo, useState } from "react";

export interface FilterableDataItem {
    name: string;
    active?: boolean;
}

export interface UseDataTableFilterOptions {
    hasActiveFilter?: boolean;
    searchThreshold?: number;
}

export interface UseDataTableFilterResult<TItem extends FilterableDataItem> {
    filteredItems: TItem[];
    searchText: string;
    onSearchTextChanged: (text: string) => void;
    onlyActive: boolean;
    onOnlyActiveChanged: (onlyActive: boolean) => void;
    showSearch: boolean;
    showActiveFilter: boolean;
}

const DEFAULT_SEARCH_THRESHOLD = 10;

export const useDataTableFilter = <TItem extends FilterableDataItem>(
    items: TItem[],
    options?: UseDataTableFilterOptions
): UseDataTableFilterResult<TItem> => {
    const hasActiveFilter = options?.hasActiveFilter ?? false;
    const searchThreshold = options?.searchThreshold ?? DEFAULT_SEARCH_THRESHOLD;

    const [searchText, setSearchText] = useState("");
    const [onlyActive, setOnlyActive] = useState(false);

    const showSearch = items.length >= searchThreshold;

    const filteredItems = useMemo(() => {
        const normalizedQuery = searchText.trim().toLowerCase();

        return items.filter((item) => {
            if (hasActiveFilter && onlyActive && item.active !== true) {
                return false;
            }

            if (showSearch && normalizedQuery.length > 0) {
                return item.name.toLowerCase().includes(normalizedQuery);
            }

            return true;
        });
    }, [items, searchText, onlyActive, hasActiveFilter, showSearch]);

    return {
        filteredItems,
        searchText,
        onSearchTextChanged: setSearchText,
        onlyActive,
        onOnlyActiveChanged: setOnlyActive,
        showSearch,
        showActiveFilter: hasActiveFilter,
    };
};
