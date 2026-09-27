import { useCallback, useEffect, useState } from "react";
import { BasePageable } from "../models/BasePageable";
import { PagedResult } from "../models/PagedResult";

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

	const defaultKeySelector = useCallback(
		(item: TItem): string | number => {
			if (item && typeof item === "object" && "id" in item) {
				return (item as { id: string | number }).id;
			}
			return JSON.stringify(item);
		},
		[]
	);

	const effectiveKeySelector = keySelector ?? defaultKeySelector;

	const fetchPage = useCallback(
		async (targetPage: number, targetSize: number, isAppend = false) => {
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
					setItems((prev) => {
						const existingKeys = new Set(prev.map(effectiveKeySelector));
						const uniqueNew = fetchedItems.filter((item) => !existingKeys.has(effectiveKeySelector(item)));
						return [...prev, ...uniqueNew];
					});
				} else {
					setItems(fetchedItems);
				}

				setTotalCount(fetchedTotalCount);
				setPageIndex(targetPage);
				setPageSize(targetSize);

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
		[fetchData, filters, effectiveKeySelector, onSuccess, onError]
	);

	const loadPage = useCallback(
		(targetPage: number, targetSize: number) => fetchPage(targetPage, targetSize, false),
		[fetchPage]
	);

	const hasNextPage = items.length < totalCount;

	const loadNextPage = useCallback(() => {
		if (isLoadingNextPage || !hasNextPage) return;
		return fetchPage(pageIndex + 1, pageSize, true);
	}, [fetchPage, isLoadingNextPage, hasNextPage, pageIndex, pageSize]);

	const refreshPage = useCallback(() => {
		return loadPage(pageIndex, pageSize);
	}, [loadPage, pageIndex, pageSize]);

	const reset = useCallback(() => {
		return loadPage(1, pageSize);
	}, [loadPage, pageSize]);

	useEffect(() => {
		if (autoLoad) {
			loadPage(1, pageSize);
		}
	}, [loadPage, autoLoad, pageSize]);

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
