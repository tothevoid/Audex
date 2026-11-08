import { Box, Table } from '@chakra-ui/react';
import { TableWrapperProps } from './types';
import { TableSkeletonRows } from './TableSkeletonRows';
import { Placeholder } from '@/shared/components/Placeholder';

export const TableWrapper = <TRecord,>({
    columns,
    isLoading = false,
    rowCount = 5,
    rowHeight = '40px',
    minWidth = '800px',
    tableLayout = 'fixed',
    size = 'sm',
    variant = 'outline',
    headerBackgroundColor = 'background_secondary',
    bodyBackgroundColor = 'background_primary',
    emptyText,
    emptyDescription,
    emptyIcon,
    emptyPlaceholder,
    isEmpty = false,
    children
}: TableWrapperProps<TRecord>) => {
    if (!isLoading && isEmpty) {
        if (emptyPlaceholder) {
            return <>{emptyPlaceholder}</>;
        }

        if (emptyText) {
            return (
                <Placeholder
                    text={emptyText}
                    description={emptyDescription}
                    icon={emptyIcon}
                />
            );
        }

        return null;
    }

    return (
        <Box overflowX="auto" maxW="100%" borderRadius="md" borderWidth="1px" borderColor="border_primary">
            <Table.Root size={size} variant={variant} tableLayout={tableLayout} minWidth={minWidth}>
                <Table.Header backgroundColor={headerBackgroundColor}>
                    <Table.Row height={rowHeight}>
                        {columns.map((column) => (
                            <Table.ColumnHeader
                                key={column.id}
                                color="text_primary"
                                width={column.width}
                                textAlign={column.textAlign}
                                whiteSpace="nowrap"
                            >
                                {column.header}
                            </Table.ColumnHeader>
                        ))}
                    </Table.Row>
                </Table.Header>

                <Table.Body backgroundColor={bodyBackgroundColor}>
                    {isLoading ? (
                        <TableSkeletonRows
                            columns={columns}
                            rowCount={rowCount}
                            rowHeight={rowHeight}
                        />
                    ) : (
                        children
                    )}
                </Table.Body>
            </Table.Root>
        </Box>
    );
};

export default TableWrapper;
