import { useCallback, useMemo, useState } from "react";
import { BasePageable } from "@/shared/models/BasePageable";
import { PagedResult } from "@/shared/models/PagedResult";
import { PaginationCoreFetchContext, usePaginationCore } from "./usePaginationCore";

export interface UseInfiniteQueryOptions<TItem, TFilter extends BasePageable> {
	fetchData: (query: TFilter) => Promise<PagedResult<TItem>>;
	filters?: Omit<TFilter, "pageIndex" | "recordsQuantity">;
	initialPageSize?: number;
	autoLoad?: boolean;
	keySelector?: (item: TItem) => string | number;
}

const defaultKeySelector = <TItem>(item: TItem): string | number => {
	if (item && typeof item === "object" && "id" in item) {
		return (item as { id: string | number }).id;
	}
	return JSON.stringify(item);
};

export function useInfiniteQuery<TItem, TFilter extends BasePageable>({
	fetchData,
	filters,
	initialPageSize = 10,
	autoLoad = true,
	keySelector = defaultKeySelector,
}: UseInfiniteQueryOptions<TItem, TFilter>) {
	const [items, setItems] = useState<TItem[]>([]);

	const handleItemsUpdate = useCallback(
		({ fetchedItems, isAppend }: PaginationCoreFetchContext<TItem>) => {
			if (isAppend) {
				setItems((previousItems) => {
					const existingKeys = new Set(previousItems.map(keySelector));
					const uniqueNew = fetchedItems.filter((item) => !existingKeys.has(keySelector(item)));
					return [...previousItems, ...uniqueNew];
				});
			} else {
				setItems(fetchedItems);
			}
		},
		[keySelector]
	);

	const {
		totalCount,
		pageIndex,
		pageSize,
		isLoading,
		isLoadingNextPage,
		executeFetch,
	} = usePaginationCore<TItem, TFilter>({
		fetchData,
		filters,
		initialPage: 1,
		initialPageSize,
		autoLoad,
		onItemsUpdate: handleItemsUpdate,
	});

	const hasNextPage = useMemo(() => {
		return items.length < totalCount;
	}, [items.length, totalCount]);

	const loadNextPage = useCallback(async () => {
		if (isLoadingNextPage || !hasNextPage) {
			return;
		}
		return executeFetch(pageIndex + 1, pageSize, true);
	}, [executeFetch, isLoadingNextPage, hasNextPage, pageIndex, pageSize]);

	const reset = useCallback(() => {
		return executeFetch(1, pageSize, false);
	}, [executeFetch, pageSize]);

	return {
		items,
		totalCount,
		isLoading,
		isLoadingNextPage,
		hasNextPage,
		loadNextPage,
		reset,
	};
}

export default useInfiniteQuery;
