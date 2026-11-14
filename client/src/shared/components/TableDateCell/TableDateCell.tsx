import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Popover, Portal } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/shared/utilities/formatters/dateFormatter';
import DatePicker from '@/shared/components/DatePicker/DatePicker';

export interface TableDateCellProps {
    value: Date | string;
    onChange: (nextDate: Date) => void;
    disabled?: boolean;
}

export const TableDateCell: React.FC<TableDateCellProps> = React.memo(({
    value,
    onChange,
    disabled = false,
}) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const dateObject = useMemo(() => {
        const parsedDate = value instanceof Date ? value : new Date(value);
        return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }, [value]);

    const formattedDateText = useMemo(() => {
        return formatDate(dateObject, i18n, false);
    }, [dateObject, i18n]);

    const handleDateSelect = useCallback((nextDate: Date | null) => {
        if (nextDate && !isNaN(nextDate.getTime())) {
            onChange(nextDate);
        }
        setIsOpen(false);
    }, [onChange]);

    return (
        <Popover.Root
            open={isOpen}
            onOpenChange={(eventDetails) => setIsOpen(eventDetails.open)}
            lazyMount={true}
            unmountOnExit={true}
            positioning={{ placement: 'bottom-start', gutter: 4 }}
        >
            <Popover.Trigger asChild>
                <Button
                    size="xs"
                    variant="ghost"
                    disabled={disabled}
                    px={2}
                    py={1}
                    h="26px"
                    fontSize="xs"
                    fontWeight={500}
                    color="text_primary"
                    borderRadius="md"
                    justifyContent="flex-start"
                    _hover={{ bg: 'background_secondary' }}
                >
                    {formattedDateText}
                </Button>
            </Popover.Trigger>

            {isOpen && (
                <Portal>
                    <Popover.Positioner zIndex="popover">
                        <Popover.Content
                            bg="background_primary"
                            borderColor="border_primary"
                            borderWidth="1px"
                            p={2}
                            borderRadius="lg"
                            boxShadow="md"
                            w="auto"
                        >
                            <Box>
                                <DatePicker
                                    size="xs"
                                    value={dateObject}
                                    onChange={handleDateSelect}
                                />
                            </Box>
                        </Popover.Content>
                    </Popover.Positioner>
                </Portal>
            )}
        </Popover.Root>
    );
});

TableDateCell.displayName = 'TableDateCell';

export default TableDateCell;

