import React, { useMemo } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utilities/formatters/dateFormatter';

export interface DateGroupedListProps<T> {
    items: T[];
    dateSelector: (item: T) => Date | string;
    keySelector: (item: T) => string;
    renderItem: (item: T) => React.ReactNode;
    renderHeaderRight?: (group: { date: Date; items: T[] }) => React.ReactNode;
    showYear?: boolean;
    headerMb?: number | string;
    headerMt?: number | string;
    groupMb?: number | string;
}

export function DateGroupedList<T>({
    items,
    dateSelector,
    keySelector,
    renderItem,
    renderHeaderRight,
    showYear = true,
    headerMb = 2,
    headerMt = 3,
    groupMb = 4
}: DateGroupedListProps<T>) {
    const { t, i18n } = useTranslation();

    const groupedItems = useMemo(() => {
        const groups = new Map<string, { date: Date; items: T[] }>();
        for (const item of items) {
            const rawDate = dateSelector(item);
            const dateObj = typeof rawDate === 'string' ? new Date(rawDate) : rawDate;
            const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            if (!groups.has(dateKey)) {
                groups.set(dateKey, { date: dateObj, items: [] });
            }
            groups.get(dateKey)!.items.push(item);
        }
        return Array.from(groups.values());
    }, [items, dateSelector]);

    return (
        <Box>
            {groupedItems.map((group) => (
                <Box key={group.date.toISOString()} mb={groupMb}>
                    <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        pb={1.5}
                        mb={headerMb}
                        mt={headerMt}
                        borderColor="border_primary"
                        borderBottomWidth="1px"
                    >
                        <Text fontWeight={600} fontSize="xs" color="text_secondary">
                            {formatDate(group.date, i18n, showYear)}
                        </Text>
                        {renderHeaderRight ? (
                            renderHeaderRight(group)
                        ) : (
                            <Text fontWeight={500} fontSize="xs" color="text_secondary">
                                {t("general_total_count", { count: group.items.length })}
                            </Text>
                        )}
                    </Flex>

                    {group.items.map((item) => (
                        <React.Fragment key={keySelector(item)}>
                            {renderItem(item)}
                        </React.Fragment>
                    ))}
                </Box>
            ))}
        </Box>
    );
}

export default DateGroupedList;
