import { Box, BoxProps, Table } from "@chakra-ui/react";
import React from "react";
import TableSkeleton from "@/shared/components/TableSkeleton/TableSkeleton";
import useDelayedLoading from "@/shared/hooks/useDelayedLoading";

const DEFAULT_DATA_TABLE_MAX_HEIGHT: BoxProps["maxH"] = {
    base: "60dvh",
    lg: "calc(100dvh - 250px)",
};

export interface ColumnDef<T> {
    header?: React.ReactNode;
    render: (item: T, index: number) => React.ReactNode;
    width?: string | number;
    align?: "start" | "center" | "end";
}

export interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    keyExtractor: (item: T, index: number) => string | number;
    isLoading?: boolean;
    skeletonRows?: number;
    maxH?: BoxProps["maxH"];
}

export const DataTable = <T,>({
    data,
    columns,
    keyExtractor,
    isLoading = false,
    skeletonRows = 5,
    maxH = DEFAULT_DATA_TABLE_MAX_HEIGHT,
}: DataTableProps<T>) => {
    const showSkeleton = useDelayedLoading(isLoading);

    if (showSkeleton) {
        return <TableSkeleton rows={skeletonRows} columns={columns.length} />;
    }

    return (
        <Box
            className="table-fade-in"
            overflowX="auto"
            overflowY={maxH ? "auto" : undefined}
            maxH={maxH}
            maxW="100%"
            borderWidth="1px"
            borderColor="border_primary"
            borderRadius="xl"
            bg="background_primary"
        >
            <Table.Root minW="600px">
                <Table.Header
                    position={maxH ? "sticky" : undefined}
                    top={maxH ? 0 : undefined}
                    zIndex={maxH ? 1 : undefined}
                    bg="background_primary"
                >
                    <Table.Row border="none" bg="background_primary" color="text_primary">
                        {columns.map((col, idx) => (
                            <Table.ColumnHeader
                                key={idx}
                                width={col.width}
                                color="text_primary"
                                textAlign={col.align}
                            >
                                {col.header}
                            </Table.ColumnHeader>
                        ))}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {data.map((item, index) => (
                        <Table.Row
                            key={keyExtractor(item, index)}
                            border="none"
                            bg="none"
                            color="text_primary"
                        >
                            {columns.map((col, colIdx) => (
                                <Table.Cell
                                    key={colIdx}
                                    width={col.width}
                                    textAlign={col.align}
                                >
                                    {col.render(item, index)}
                                </Table.Cell>
                            ))}
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Box>
    );
};

export default DataTable;
