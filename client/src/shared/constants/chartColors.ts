/**
 * Shared color palettes and semantic colors for Recharts across the application.
 * Tailored for Audex dark theme (#121212 / #1E1E1E / #242424).
 */

export const CHARTS_COLORS = [
    "#38bdf8", // Sky blue
    "#818cf8", // Indigo
    "#34d399", // Emerald
    "#fbbf24", // Amber
    "#f472b6", // Pink
    "#a78bfa", // Purple
    "#2dd4bf", // Teal
    "#fb923c", // Orange
    "#60a5fa", // Blue
    "#e879f9", // Fuchsia
    "#4ade80", // Light green
    "#f87171", // Coral red
    "#c084fc", // Violet
    "#38d9a9", // Mint
    "#facc15", // Yellow
    "#ec4899", // Rose
];

export const CHART_THEME_COLORS = {
    earnings: "var(--chakra-colors-gain)",
    positive: "var(--chakra-colors-gain)",
    negative: "var(--chakra-colors-loss)",
    grid: "var(--chakra-colors-border_primary)",
    axisLine: "var(--chakra-colors-border_primary)",
    axisText: "var(--chakra-colors-text_secondary)",
    cursorStroke: "var(--chakra-colors-border_primary)",
    cursorFill: "var(--chakra-colors-background_secondary)",
    tooltipBg: "var(--chakra-colors-background_primary)",
    tooltipBorder: "var(--chakra-colors-border_primary)",
    divider: "var(--chakra-colors-border_primary)",
};

export const getChartColor = (index: number): string => {
    return CHARTS_COLORS[index % CHARTS_COLORS.length];
};
