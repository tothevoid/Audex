export interface PagedResult<T> {
	items: T[];
	totalCount: number;
	pageIndex: number;
	pageSize: number;
}
