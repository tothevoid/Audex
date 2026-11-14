import React, { useState } from "react";
import { getMonthsNames } from "@/shared/utilities/dateUtils";
import { useTranslation } from "react-i18next";
import { Box, Button, Flex, Grid, IconButton, Text } from "@chakra-ui/react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

export interface CalendarProps {
    year: number;
    month?: number | null;
    onPageSwitched: (month: number | null, year: number) => void;
}

interface CalendarState {
    minimalYear: number;
    isYearsMode: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({
    year: selectedYear,
    month: selectedMonth,
    onPageSwitched,
}) => {
    const { t, i18n } = useTranslation();

    const [state, setState] = useState<CalendarState>({
        minimalYear: selectedYear,
        isYearsMode: false,
    });

    const { minimalYear, isYearsMode } = state;

    const handleArrowClick = (delta: number) => {
        setState((previousState) => ({
            ...previousState,
            minimalYear: previousState.isYearsMode
                ? previousState.minimalYear + delta * 12
                : previousState.minimalYear + delta,
        }));
    };

    const handleToggleYearsMode = () => {
        setState((previousState) => ({
            ...previousState,
            isYearsMode: !previousState.isYearsMode,
        }));
    };

    const handleSelectYear = (yearValue: number) => {
        onPageSwitched(selectedMonth ?? null, yearValue);
        setState((previousState) => ({
            ...previousState,
            isYearsMode: false,
            minimalYear: yearValue,
        }));
    };

    const handleSelectMonth = (monthValue: number) => {
        onPageSwitched(monthValue, minimalYear);
    };

    const handleSelectWholeYear = () => {
        onPageSwitched(null, minimalYear);
    };

    const isWholeYearSelected =
        !isYearsMode &&
        (selectedMonth === null || selectedMonth === undefined) &&
        selectedYear === minimalYear;

    const monthsNames = getMonthsNames(i18n);

    const titleText = isYearsMode
        ? `${minimalYear} - ${minimalYear + 11}`
        : minimalYear.toString();

    return (
        <Box color="text_primary" w="210px">
            {/* Header: Prev, Title (Year/Range), Next */}
            <Flex align="center" justify="space-between" mb={2}>
                <IconButton
                    size="2xs"
                    variant="ghost"
                    color="text_secondary"
                    _hover={{ color: "text_primary", backgroundColor: "background_secondary" }}
                    onClick={() => handleArrowClick(-1)}
                    aria-label="Previous"
                >
                    <MdChevronLeft size={18} />
                </IconButton>

                <Button
                    size="xs"
                    variant="ghost"
                    h="28px"
                    px={2}
                    fontWeight={700}
                    fontSize="sm"
                    color="text_primary"
                    _hover={{ backgroundColor: "background_secondary" }}
                    onClick={handleToggleYearsMode}
                >
                    <Text>{titleText}</Text>
                </Button>

                <IconButton
                    size="2xs"
                    variant="ghost"
                    color="text_secondary"
                    _hover={{ color: "text_primary", backgroundColor: "background_secondary" }}
                    onClick={() => handleArrowClick(1)}
                    aria-label="Next"
                >
                    <MdChevronRight size={18} />
                </IconButton>
            </Flex>

            {/* Whole Year Option */}
            {!isYearsMode && (
                <Box mb={2}>
                    <Button
                        size="xs"
                        w="100%"
                        h="28px"
                        variant={isWholeYearSelected ? "solid" : "outline"}
                        colorPalette={isWholeYearSelected ? "blue" : undefined}
                        borderColor={isWholeYearSelected ? undefined : "border_primary"}
                        onClick={handleSelectWholeYear}
                        fontSize="2xs"
                        fontWeight={600}
                    >
                        {t('filter_whole_year', { year: minimalYear })}
                    </Button>
                </Box>
            )}

            {/* Grid of Months (3x4) or Years (3x4) */}
            <Grid templateColumns="repeat(4, 1fr)" gap={1}>
                {isYearsMode
                    ? Array.from({ length: 12 }, (_, index) => {
                          const yearValue = minimalYear + index;
                          const isSelected = selectedYear === yearValue;

                          return (
                              <Button
                                  key={yearValue}
                                  size="xs"
                                  h="34px"
                                  variant={isSelected ? "solid" : "ghost"}
                                  colorPalette={isSelected ? "blue" : undefined}
                                  color={isSelected ? undefined : "text_primary"}
                                  _hover={{
                                      backgroundColor: isSelected
                                          ? undefined
                                          : "background_secondary",
                                  }}
                                  onClick={() => handleSelectYear(yearValue)}
                                  fontSize="2xs"
                                  fontWeight={isSelected ? 700 : 500}
                              >
                                  {yearValue}
                              </Button>
                          );
                      })
                    : monthsNames.map((monthName, index) => {
                          const monthValue = index + 1;
                          const isSelected =
                              selectedMonth === monthValue &&
                              selectedYear === minimalYear;

                          return (
                              <Button
                                  key={monthValue}
                                  size="xs"
                                  h="34px"
                                  variant={isSelected ? "solid" : "ghost"}
                                  colorPalette={isSelected ? "blue" : undefined}
                                  color={isSelected ? undefined : "text_primary"}
                                  _hover={{
                                      backgroundColor: isSelected
                                          ? undefined
                                          : "background_secondary",
                                  }}
                                  onClick={() => handleSelectMonth(monthValue)}
                                  fontSize="2xs"
                                  fontWeight={isSelected ? 700 : 500}
                                  textTransform="capitalize"
                              >
                                  {monthName}
                              </Button>
                          );
                      })}
            </Grid>
        </Box>
    );
};