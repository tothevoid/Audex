import { useCallback, useState } from "react";
import { BasePageable } from "@/shared/models/BasePageable";
import { PagedResult } from "@/shared/models/PagedResult";
import { PaginationCoreFetchContext, usePaginationCore } from "./usePaginationCore";

export interface UsePagedQueryOptions<TItem, TFilter extends BasePageable> {
	fetchData: (query: TFilter) => Promise<PagedResult<TItem>>;
	filters?: Omit<TFilter, "pageIndex" | "recordsQuantity">;
	initialPage?: number;
	initialPageSize?: number;
	autoLoad?: boolean;
}

export function usePagedQuery<TItem, TFilter extends BasePageable>({
	fetchData,
	filters,
	initialPage = 1,
	initialPageSize = 10,
	autoLoad = true,
}: UsePagedQueryOptions<TItem, TFilter>) {
	const [items, setItems] = useState<TItem[]>([]);

	const handleItemsUpdate = useCallback((context: PaginationCoreFetchContext<TItem>) => {
		setItems(context.fetchedItems);
	}, []);

	const {
		totalCount,
		pageIndex,
		pageSize,
		setPageSize,
		isLoading,
		executeFetch,
	} = usePaginationCore<TItem, TFilter>({
		fetchData,
		filters,
		initialPage,
		initialPageSize,
		autoLoad,
		onItemsUpdate: handleItemsUpdate,
	});

	const loadPage = useCallback(
		(targetPage: number, targetSize?: number) => {
			const newPageSize = targetSize ?? pageSize;

			if (targetSize && targetSize !== pageSize) {
				setPageSize(targetSize);
			}
			return executeFetch(targetPage, newPageSize, false);
		},
		[pageSize, setPageSize, executeFetch]
	);

	const refreshPage = useCallback(() => {
		return executeFetch(pageIndex, pageSize, false);
	}, [executeFetch, pageIndex, pageSize]);

	const reset = useCallback(() => {
		const defaultPageIndex = 1;
		return executeFetch(defaultPageIndex, pageSize, false);
	}, [executeFetch, pageSize]);

	return {
		items,
		totalCount,
		pageIndex,
		pageSize,
		isLoading,
		loadPage,
		refreshPage,
		reset,
	};
}

export default usePagedQuery;
