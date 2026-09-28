import React, { ReactNode } from "react";
import { Box, Stack } from "@chakra-ui/react";
import LoadingList from "@/shared/components/LoadingList/LoadingList";
import PlaceholderWrapper from "@/shared/components/Placeholder/PlaceholderWrapper";
import CollectionPagination from "@/shared/components/CollectionPagination/CollectionPagination";

export interface PagedQueryState<T> {
	items: T[];
	isLoading: boolean;
	totalCount: number;
	pageIndex: number;
	pageSize: number;
	loadPage: (page: number, pageSize: number) => unknown;
}

interface Props<T> {
	query: PagedQueryState<T>;
	emptyText: string;
	emptyAction?: ReactNode;
	renderItem?: (item: T, index: number) => ReactNode;
	renderList?: (items: T[]) => ReactNode;
	keySelector?: (item: T, index: number) => string | number;
	skeletonCount?: number;
	skeletonHeight?: string | number;
	itemGap?: number | string;
	pageSizeOptions?: number[];
	showPageSizeSelector?: boolean;
	showTotalCount?: boolean;
	size?: "xs" | "sm" | "md" | "lg";
}

export function PaginatedList<T>({
	query,
	emptyText,
	emptyAction,
	renderItem,
	renderList,
	keySelector = (_, index) => index,
	skeletonCount = 3,
	skeletonHeight = "72px",
	itemGap = 3,
	pageSizeOptions,
	showPageSizeSelector = true,
	showTotalCount = true,
	size = "md"
}: Props<T>) {
	const { items, isLoading, totalCount, pageIndex, pageSize, loadPage } = query;
	const hasData = items && items.length > 0;

	return (
		<Box>
			<LoadingList isLoading={isLoading} count={skeletonCount} height={skeletonHeight}>
				<PlaceholderWrapper hasData={hasData} text={emptyText} action={emptyAction}>
					{renderList ? (
						renderList(items)
					) : renderItem ? (
						<Stack gap={itemGap}>
							{items.map((item, index) => (
								<React.Fragment key={keySelector(item, index)}>
									{renderItem(item, index)}
								</React.Fragment>
							))}
						</Stack>
					) : null}
				</PlaceholderWrapper>
			</LoadingList>

			<CollectionPagination
				count={totalCount}
				page={pageIndex}
				pageSize={pageSize}
				pageSizeOptions={pageSizeOptions}
				showPageSizeSelector={showPageSizeSelector}
				showTotalCount={showTotalCount}
				onPageChange={(targetPage, targetPageSize) => loadPage(targetPage, targetPageSize)}
				size={size}
			/>
		</Box>
	);
}

export default PaginatedList;
