import { useCallback, useEffect, useState } from "react";
import { BasePageable } from "@/shared/models/BasePageable";
import { PagedResult } from "@/shared/models/PagedResult";

export interface UsePagedQueryOptions<TItem, TFilter extends BasePageable> {
	fetchData: (query: TFilter) => Promise<PagedResult<TItem>>;
	filters?: Omit<TFilter, "pageIndex" | "recordsQuantity">;
	initialPage?: number;
	initialPageSize?: number;
	autoLoad?: boolean;
	keySelector?: (item: TItem) => string | number;
	onSuccess?: (result: PagedResult<TItem>) => void;
	onError?: (error: unknown) => void;
}

const defaultKeySelector = <TItem>(item: TItem): string | number => {
	if (item && typeof item === "object" && "id" in item) {
		return (item as { id: string | number }).id;
	}
	return JSON.stringify(item);
};

export function usePagedQuery<TItem, TFilter extends BasePageable>({
	fetchData,
	filters,
	initialPage = 1,
	initialPageSize = 10,
	autoLoad = true,
	keySelector,
	onSuccess,
	onError
}: UsePagedQueryOptions<TItem, TFilter>) {
	const [items, setItems] = useState<TItem[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);
	const [pageIndex, setPageIndex] = useState<number>(initialPage);
	const [pageSize, setPageSize] = useState<number>(initialPageSize);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isLoadingNextPage, setIsLoadingNextPage] = useState<boolean>(false);

	const executeFetch = useCallback(
		async (targetPage: number, targetSize: number, isAppend: boolean) => {
			const setLoadingState = isAppend ? setIsLoadingNextPage : setIsLoading;
			setLoadingState(true);
			try {
				const query = {
					...filters,
					pageIndex: targetPage,
					recordsQuantity: targetSize
				} as TFilter;

				const result = await fetchData(query);
				const fetchedItems = result?.items ?? [];
				const fetchedTotalCount = result?.totalCount ?? 0;

				if (isAppend) {
					const keyFn = keySelector ?? defaultKeySelector;
					setItems((prevItems) => {
						const existingKeys = new Set(prevItems.map(keyFn));
						const uniqueNew = fetchedItems.filter((item) => !existingKeys.has(keyFn(item)));
						return [...prevItems, ...uniqueNew];
					});
				} else {
					setItems(fetchedItems);
				}

				setTotalCount(fetchedTotalCount);
				onSuccess?.(result);
				return result;
			} catch (error) {
				console.error("usePagedQuery fetch error:", error);
				onError?.(error);
				throw error;
			} finally {
				setLoadingState(false);
			}
		},
		[fetchData, filters, keySelector, onSuccess, onError]
	);

	useEffect(() => {
		if (autoLoad) {
			setPageIndex(1);
			executeFetch(1, pageSize, false);
		}
	}, [autoLoad, filters, pageSize, executeFetch]);

	const loadPage = useCallback(
		(targetPage: number, targetSize?: number) => {
			const newPageSize = targetSize ?? pageSize;
			setPageIndex(targetPage);

			const isTargetSizeChanged = targetSize && targetSize !== pageSize
			if (isTargetSizeChanged) {
				setPageSize(targetSize);
			}
			return executeFetch(targetPage, newPageSize, false);
		},
		[pageSize, executeFetch]
	);

	const hasNextPage = items.length < totalCount;

	const loadNextPage = useCallback(async () => {
		if (isLoadingNextPage || !hasNextPage) return;
		const nextPage = pageIndex + 1;
		setPageIndex(nextPage);
		return executeFetch(nextPage, pageSize, true);
	}, [executeFetch, isLoadingNextPage, hasNextPage, pageIndex, pageSize]);

	const refreshPage = useCallback(() => {
		return executeFetch(pageIndex, pageSize, false);
	}, [executeFetch, pageIndex, pageSize]);

	const reset = useCallback(() => {
		const defaultPageIndex = 1;

		setPageIndex(defaultPageIndex);
		return executeFetch(defaultPageIndex, pageSize, false);
	}, [executeFetch, pageSize]);

	return {
		items,
		totalCount,
		pageIndex,
		pageSize,
		isLoading,
		isLoadingNextPage,
		hasNextPage,
		loadPage,
		loadNextPage,
		refreshPage,
		reset
	};
}

export default usePagedQuery;
