import { Fragment, useEffect, useState } from "react";
import { getDepositsRange } from "@/api/deposits/depositApi";
import { Box, Slider } from "@chakra-ui/react";
import { DepositsRange } from "@/models/deposits/depositsRange";
import { formatMonthYear } from "@/shared/utilities/formatters/dateFormatter";

interface State {
    minMonths: number | null,
    maxMonths: number | null,
    selectedMinMonths: number | null,
    selectedMaxMonths: number | null,
    marks: SliderMark[]
}

interface SliderMark {
    value: number;
    label: React.ReactNode;
}

interface Props {
    onDepositsRangeChanged: (fromMonths: number, toMonths: number) => void;
    refreshTrigger?: any;
}

const convertRange = (range: DepositsRange) => {
    const minDate = new Date(range.from);
    const minDateMonth = minDate.getMonth() + 1;
    const minMonths = minDate.getFullYear() * 12 + minDateMonth;
    const maxDate = new Date(range.to);
    const maxDateMonth =  maxDate.getMonth() + 1;
    const maxMonths = maxDate.getFullYear() * 12 + maxDateMonth;

    //TODO: use culture to display date
    const marks: SliderMark[] = [

        { value: minMonths, label: formatMonthYear(minDateMonth, minDate.getFullYear()) },
        { value: maxMonths, label: formatMonthYear(maxDateMonth, maxDate.getFullYear()) },
    ]
    return {minMonths, maxMonths, marks, selectedMinMonths: minMonths, selectedMaxMonths: maxMonths};
}

const DepositsRangeSlider = (props: Props) => {
    const [state, setState] = useState<State>({
        minMonths: null, 
        maxMonths: null, 
        selectedMinMonths: null, 
        selectedMaxMonths: null, 
        marks: []});

    useEffect(() => {
        const getData = async () => {
            const range = await getDepositsRange();
            if (!range) {
                return;
            }
            const ranges = convertRange(range);
            setState((currentState) => {
                return {...currentState, ...ranges}
            });
            props.onDepositsRangeChanged(ranges.selectedMinMonths, ranges.selectedMaxMonths);
        }
        getData();
    }, [props.refreshTrigger]);

    const onSliderValueChanged = (selectedValues: number[]) => {
        const newSliderValues = {selectedMinMonths: selectedValues[0], selectedMaxMonths: selectedValues[1]}
        setState((currentState) => {
            return {...currentState, ...newSliderValues}
        })
        props.onDepositsRangeChanged(newSliderValues.selectedMinMonths, newSliderValues.selectedMaxMonths);
    }

    if (!state.selectedMaxMonths || !state.selectedMinMonths) {
        return <Fragment/>
    }

    return (
        <Box width={"100%"} pb={6} pt={2} px={1}>
            <Slider.Root width={"100%"} min={state.minMonths!} max={state.maxMonths!} onValueChange={(details) => onSliderValueChanged(details.value)} 
                value={[state.selectedMinMonths!, state.selectedMaxMonths!]} step={1}>
                <Slider.Control>
                    <Slider.Track>
                        <Slider.Range background={"action_primary"} />
                    </Slider.Track>
                    <Slider.Thumbs />
                    <Slider.Marks whiteSpace="nowrap" marks={state.marks}/>
                </Slider.Control>
            </Slider.Root>
        </Box>
    );
}

export default DepositsRangeSlider;