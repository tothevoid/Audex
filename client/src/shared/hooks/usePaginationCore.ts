import { useCallback, useEffect, useState } from "react";
import { BasePageable } from "@/shared/models/BasePageable";
import { PagedResult } from "@/shared/models/PagedResult";

export interface PaginationCoreFetchContext<TItem> {
	fetchedItems: TItem[];
	fetchedTotalCount: number;
	targetPage: number;
	isAppend: boolean;
}

export interface UsePaginationCoreOptions<TItem, TFilter extends BasePageable> {
	fetchData: (query: TFilter) => Promise<PagedResult<TItem>>;
	filters?: Omit<TFilter, "pageIndex" | "recordsQuantity">;
	initialPage?: number;
	initialPageSize?: number;
	autoLoad?: boolean;
	onItemsUpdate: (context: PaginationCoreFetchContext<TItem>) => void;
}

export function usePaginationCore<TItem, TFilter extends BasePageable>({
	fetchData,
	filters,
	initialPage = 1,
	initialPageSize = 10,
	autoLoad = true,
	onItemsUpdate,
}: UsePaginationCoreOptions<TItem, TFilter>) {
	const [totalCount, setTotalCount] = useState<number>(0);
	const [pageIndex, setPageIndex] = useState<number>(initialPage);
	const [pageSize, setPageSize] = useState<number>(initialPageSize);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isLoadingNextPage, setIsLoadingNextPage] = useState<boolean>(false);

	const executeFetch = useCallback(
		async (targetPage: number, targetSize: number, isAppend: boolean) => {
			const setLoading = isAppend ? setIsLoadingNextPage : setIsLoading;
			setLoading(true);

			try {
				const query = {
					...filters,
					pageIndex: targetPage,
					recordsQuantity: targetSize,
				} as TFilter;

				const result = await fetchData(query);
				const fetchedItems = result?.items ?? [];
				const fetchedTotalCount = result?.totalCount ?? 0;

				onItemsUpdate({
					fetchedItems,
					fetchedTotalCount,
					targetPage,
					isAppend,
				});

				setTotalCount(fetchedTotalCount);
				setPageIndex(targetPage);
				return result;
			} catch (error: unknown) {
				console.error("usePaginationCore fetch error:", error);
			} finally {
				setLoading(false);
			}
		},
		[fetchData, filters, onItemsUpdate]
	);

	useEffect(() => {
		if (!autoLoad) {
			return;
		}

		let isCurrent = true;

		const syncInitial = async () => {
			if (isCurrent) {
				await executeFetch(1, pageSize, false);
			}
		};

		syncInitial();

		return () => {
			isCurrent = false;
		};
	}, [autoLoad, filters, pageSize, executeFetch]);

	return {
		totalCount,
		pageIndex,
		pageSize,
		setPageSize,
		isLoading,
		isLoadingNextPage,
		executeFetch,
	};
}
