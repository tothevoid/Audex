export const getChartLabelConfig = () => {
    return {
        backgroundColor: 'var(--chakra-colors-background_primary)',
        borderColor: 'var(--chakra-colors-border_primary)',
        color: "var(--chakra-colors-text_primary)",
        borderRadius: "10px"
    };
};

export interface ChartClickEvent {
    activeLabel?: unknown;
    activeTooltipIndex?: unknown;
}

export const extractDateFromChartClick = (
    event: ChartClickEvent | null | undefined,
    data: readonly { date: string }[]
): Date | null => {
    let dateString: string | undefined;

    if (typeof event?.activeLabel === "string") {
        dateString = event.activeLabel;
    } else if (
        typeof event?.activeTooltipIndex === "number" &&
        data[event.activeTooltipIndex]
    ) {
        dateString = data[event.activeTooltipIndex].date;
    }

    if (!dateString) {
        return null;
    }

    const parsedDate = new Date(dateString);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const handleChartPointClick = (
    event: ChartClickEvent | null | undefined,
    data: readonly { date: string }[],
    onPointClick?: (date: Date) => void
): void => {
    if (!onPointClick) {
        return;
    }

    const clickedDate = extractDateFromChartClick(event, data);
    if (clickedDate) {
        onPointClick(clickedDate);
    }
};