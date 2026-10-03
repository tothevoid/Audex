import { useEffect, useRef, useState } from "react";
import "./MonthPicker.css";
import { getMonthByIndex } from "@/shared/utilities/dateUtils";
import { Calendar } from "@/shared/components/Calendar/Calendar";
import { MdChevronLeft, MdChevronRight, MdCalendarMonth } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { Box, Button, Flex } from "@chakra-ui/react";

type Props = {
    month: number;
    year: number;
    onPageSwitched: (month: number, year: number) => void;
};

const MonthPicker: React.FC<Props> = ({ month, year, onPageSwitched }: Props) => {
    const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isCalendarVisible) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsCalendarVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isCalendarVisible]);

    const pageSwitchClick = (direction: number) => () => {
        let newMonth = month;
        let newYear = year;
        if (direction === -1 && newMonth === 1) {
            newMonth = 12;
            newYear += direction;
        } else if (direction === 1 && newMonth === 12) {
            newMonth = 1;
            newYear += direction;
        } else {
            newMonth += direction;
        }
        onPageSwitched(newMonth, newYear);
    };

    const onSwitchCalendarVisibility = () => {
        setIsCalendarVisible((previousVisibility) => !previousVisibility);
    };

    const { i18n } = useTranslation();
    const date = `${getMonthByIndex(month, i18n)}'${year.toString().substring(2)}`;

    return (
        <Box ref={containerRef} position="relative" display="inline-flex" flexDirection="column" alignItems="center">
            <Flex justifyContent="center" className="pagination-container" color="text_primary">
                <Button color="text_primary" background={'background_primary'} onClick={pageSwitchClick(-1)} className="paging-element paging-button page-previous"><MdChevronLeft /></Button>
                <Button minW={125} color="text_primary" background={'background_primary'} borderRadius={0} className="calendar-icon current-month paging-element" 
                    onClick={onSwitchCalendarVisibility}>
                    {date}
                    <MdCalendarMonth />
                </Button>
                <Button color="text_primary" background={'background_primary'} onClick={pageSwitchClick(1)} className="paging-element paging-button page-next"><MdChevronRight /></Button>
            </Flex>
            {isCalendarVisible && (
                <Box
                    position="absolute"
                    top="calc(100% + 6px)"
                    left="50%"
                    transform="translateX(-50%)"
                    zIndex={100}
                    boxShadow="xl"
                    borderRadius="md"
                >
                    <Calendar
                        month={month}
                        year={year}
                        onPageSwitched={(selectedMonth, selectedYear) => {
                            onPageSwitched(selectedMonth, selectedYear);
                            setIsCalendarVisible(false);
                        }}
                    />
                </Box>
            )}
        </Box>
    );
};

export default MonthPicker;