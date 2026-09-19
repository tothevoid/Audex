import { useEffect, useRef, useState } from "react"
import "./MonthPicker.css"
import { getMonthByIndex } from "../../../../shared/utilities/dateUtils"
import { Calendar } from "../../../../shared/components/Calendar/Calendar"
import { MdChevronLeft, MdChevronRight, MdCalendarMonth } from "react-icons/md"
import { useTranslation } from "react-i18next"
import { Box, Button, Flex } from "@chakra-ui/react"

type State = {
    isCalendarVisible: boolean
}

type Props = {
    month: number,
    year: number,
    onPageSwitched: (month: number, year: number) => void
}

const MonthPicker: React.FC<Props> = (props: Props) => {
    const [state, setState] = useState<State>({ isCalendarVisible: false })
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const { month, year } = props;
        props.onPageSwitched(month, year);
    }, []);

    useEffect(() => {
        if (!state.isCalendarVisible) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setState({ isCalendarVisible: false });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [state.isCalendarVisible]);

    const pageSwitchClick = (direction: number) => () => {
        let { month, year } = props;
        if (direction === -1 && month === 1) {
            month = 12;
            year += direction;
        } else if (direction === 1 && month === 12) {
            month = 1;
            year += direction;
        } else {
            month += direction;
        }
        props.onPageSwitched(month, year);
    }

    const onSwitchCalendarVisibility = () => {
        setState((prev) => ({ isCalendarVisible: !prev.isCalendarVisible }));
    }

    const { i18n } = useTranslation();
    const { isCalendarVisible } = state;
    const { month, year, onPageSwitched } = props;
    const date = `${getMonthByIndex(month, i18n)}'${year.toString().substring(2)}`

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
                        onPageSwitched={(m, y) => {
                            onPageSwitched(m, y);
                            setState({ isCalendarVisible: false });
                        }}
                    />
                </Box>
            )}
        </Box>
    );
}

export default MonthPicker;