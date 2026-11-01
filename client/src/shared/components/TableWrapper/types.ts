import type { ReactNode } from 'react';

export interface TableColumnConfig<TRecord = unknown> {
    id: string;
    header?: ReactNode;
    width?: string | number;
    textAlign?: 'start' | 'center' | 'end';
    skeletonWidth?: string;
    skeletonHeight?: string;
    skeletonBorderRadius?: string;
    render?: (record: TRecord, index: number) => ReactNode;
}

export interface TableSkeletonRowsProps<TRecord = unknown> {
    columns: TableColumnConfig<TRecord>[];
    rowCount: number;
    rowHeight?: string | number;
}

export interface TableWrapperProps<TRecord = unknown> {
    columns: TableColumnConfig<TRecord>[];
    isLoading?: boolean;
    rowCount?: number;
    rowHeight?: string | number;
    minWidth?: string | number;
    tableLayout?: 'fixed' | 'auto';
    size?: 'sm' | 'md' | 'lg';
    variant?: 'outline' | 'line';
    headerBackgroundColor?: string;
    bodyBackgroundColor?: string;
    emptyText?: string;
    emptyDescription?: string;
    emptyIcon?: ReactNode;
    emptyPlaceholder?: ReactNode;
    isEmpty?: boolean;
    children?: ReactNode;
}
