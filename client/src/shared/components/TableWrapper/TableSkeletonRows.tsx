import { Skeleton, Table } from '@chakra-ui/react';
import { TableSkeletonRowsProps } from './types';

export const TableSkeletonRows = <TRecord,>({
    columns,
    rowCount,
    rowHeight = '40px'
}: TableSkeletonRowsProps<TRecord>) => {
    return (
        <>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <Table.Row key={`skeleton-row-${rowIndex}`} height={rowHeight}>
                    {columns.map((column, columnIndex) => (
                        <Table.Cell
                            key={column.id || `skeleton-column-${columnIndex}`}
                            verticalAlign="middle"
                            whiteSpace="nowrap"
                            textAlign={column.textAlign}
                        >
                            <Skeleton
                                height={column.skeletonHeight ?? '18px'}
                                width={column.skeletonWidth ?? '70%'}
                                borderRadius={column.skeletonBorderRadius ?? 'sm'}
                            />
                        </Table.Cell>
                    ))}
                </Table.Row>
            ))}
        </>
    );
};

export default TableSkeletonRows;
