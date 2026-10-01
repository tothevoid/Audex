import React, { useMemo } from "react";
import { Box, Slider } from "@chakra-ui/react";
import { formatMonthYear } from "@/shared/utilities/formatters/dateFormatter";

interface SliderMark {
    value: number;
    label: React.ReactNode;
}

interface Props {
    minMonths: number;
    maxMonths: number;
    selectedMinMonths: number;
    selectedMaxMonths: number;
    onRangeChange: (fromMonths: number, toMonths: number) => void;
}

const DepositsRangeSlider: React.FC<Props> = ({
    minMonths,
    maxMonths,
    selectedMinMonths,
    selectedMaxMonths,
    onRangeChange
}) => {
    const marks: SliderMark[] = useMemo(() => {
        if (!minMonths || !maxMonths) {
            return [];
        }

        const minDateMonth = ((minMonths - 1) % 12) + 1;
        const minDateYear = Math.floor((minMonths - 1) / 12);
        const maxDateMonth = ((maxMonths - 1) % 12) + 1;
        const maxDateYear = Math.floor((maxMonths - 1) / 12);

        return [
            { value: minMonths, label: formatMonthYear(minDateMonth, minDateYear) },
            { value: maxMonths, label: formatMonthYear(maxDateMonth, maxDateYear) }
        ];
    }, [minMonths, maxMonths]);

    if (!selectedMinMonths || !selectedMaxMonths) {
        return null;
    }

    return (
        <Box width="100%" pb={6} pt={2} px={1}>
            <Slider.Root
                width="100%"
                min={minMonths}
                max={maxMonths}
                value={[selectedMinMonths, selectedMaxMonths]}
                step={1}
                onValueChange={(details) => onRangeChange(details.value[0], details.value[1])}
            >
                <Slider.Control>
                    <Slider.Track>
                        <Slider.Range background="action_primary" />
                    </Slider.Track>
                    <Slider.Thumbs />
                    <Slider.Marks whiteSpace="nowrap" marks={marks} />
                </Slider.Control>
            </Slider.Root>
        </Box>
    );
};

export default DepositsRangeSlider;