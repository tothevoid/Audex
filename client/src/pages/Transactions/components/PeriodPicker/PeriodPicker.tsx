import React, { useState } from "react";
import { getMonthByIndex } from "@/shared/utilities/dateUtils";
import { Calendar } from "@/shared/components/Calendar/Calendar";
import { MdChevronLeft, MdChevronRight, MdCalendarMonth } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { Box, Button, Flex, HStack, Icon, Popover } from "@chakra-ui/react";

export interface PeriodPickerProps {
    month?: number | null;
    year: number;
    onPeriodChange: (month: number | null, year: number) => void;
}

export const PeriodPicker: React.FC<PeriodPickerProps> = ({
    month,
    year,
    onPeriodChange,
}) => {
    const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);
    const { t, i18n } = useTranslation();

    const isWholeYear = month === null || month === undefined;

    const handleShiftYear = (deltaYears: number) => {
        onPeriodChange(null, year + deltaYears);
    };

    const handleShiftMonth = (deltaMonths: number) => {
        const currentMonth = month ?? 1;
        const shiftedDate = new Date(year, currentMonth - 1 + deltaMonths, 1);
        onPeriodChange(shiftedDate.getMonth() + 1, shiftedDate.getFullYear());
    };

    const handleNavigatePrevious = () => {
        if (isWholeYear) {
            handleShiftYear(-1);
        } else {
            handleShiftMonth(-1);
        }
    };

    const handleNavigateNext = () => {
        if (isWholeYear) {
            handleShiftYear(1);
        } else {
            handleShiftMonth(1);
        }
    };

    const formattedDate = isWholeYear
        ? t('filter_year_label', { year })
        : `${getMonthByIndex(month, i18n)} '${year.toString().substring(2)}`;

    return (
        <Box display="inline-flex">
            <HStack
                gap={0}
                borderWidth="1px"
                borderColor="border_primary"
                borderRadius="lg"
                backgroundColor="background_primary"
                overflow="hidden"
                h="36px"
            >
                <Button
                    size="sm"
                    variant="ghost"
                    h="100%"
                    px={2}
                    borderRadius={0}
                    color="text_secondary"
                    _hover={{ color: "text_primary", backgroundColor: "background_secondary" }}
                    onClick={handleNavigatePrevious}
                    title={isWholeYear ? "Previous year" : "Previous month"}
                >
                    <Icon size="md">
                        <MdChevronLeft />
                    </Icon>
                </Button>

                <Popover.Root
                    open={isCalendarVisible}
                    onOpenChange={(eventDetails) => setIsCalendarVisible(eventDetails.open)}
                    positioning={{ placement: "bottom-start", gutter: 6 }}
                >
                    <Popover.Trigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            h="100%"
                            px={3}
                            minW="120px"
                            borderRadius={0}
                            borderLeftWidth="1px"
                            borderRightWidth="1px"
                            borderColor="border_primary"
                            color="text_primary"
                            fontWeight={600}
                            fontSize="sm"
                            _hover={{ backgroundColor: "background_secondary" }}
                        >
                            <Flex align="center" justify="center" gap={1.5} w="100%">
                                <span>{formattedDate}</span>
                                <Icon size="sm" color="text_secondary">
                                    <MdCalendarMonth />
                                </Icon>
                            </Flex>
                        </Button>
                    </Popover.Trigger>
                    <Popover.Positioner>
                        <Popover.Content
                            p={2.5}
                            borderWidth="1px"
                            borderColor="border_primary"
                            borderRadius="xl"
                            boxShadow="xl"
                            backgroundColor="background_primary"
                            outline="none"
                            w="auto"
                            minW="unset"
                        >
                            <Calendar
                                month={month}
                                year={year}
                                onPageSwitched={(selectedMonth, selectedYear) => {
                                    onPeriodChange(selectedMonth, selectedYear);
                                    setIsCalendarVisible(false);
                                }}
                            />
                        </Popover.Content>
                    </Popover.Positioner>
                </Popover.Root>

                <Button
                    size="sm"
                    variant="ghost"
                    h="100%"
                    px={2}
                    borderRadius={0}
                    color="text_secondary"
                    _hover={{ color: "text_primary", backgroundColor: "background_secondary" }}
                    onClick={handleNavigateNext}
                    title={isWholeYear ? "Next year" : "Next month"}
                >
                    <Icon size="md">
                        <MdChevronRight />
                    </Icon>
                </Button>
            </HStack>
        </Box>
    );
};

export default PeriodPicker;