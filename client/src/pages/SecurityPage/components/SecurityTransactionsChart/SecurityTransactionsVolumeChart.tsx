import React from "react";
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
} from "recharts";
import { Box, HStack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { formatNumericDate } from "@/shared/utilities/formatters/dateFormatter";
import { SecurityTransactionsHistory } from "@/models/securities/SecurityTransactionsHistory";
import { SecurityTransactionsVolumeTooltip } from "./SecurityTransactionsVolumeTooltip";

interface Props {
    data: SecurityTransactionsHistory[];
}

export const SecurityTransactionsVolumeChart: React.FC<Props> = ({ data }) => {
    const { t, i18n } = useTranslation();

    return (
        <Box width="100%">
            {/* Subheader: Volume Series */}
            <HStack gap={2} pl="95px" mt={4} mb={1} alignItems="center">
                <Box
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    backgroundColor="#10B981"
                />
                <Text fontSize="xs" fontWeight={600} color="text_secondary">
                    {t("securities_transactions_volume")}
                </Text>
            </HStack>

            {/* Subchart: Volume with Gradient Bar */}
            <Box width="100%" height="150px">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        syncId="securityTransactionsSync"
                        data={data}
                        margin={{
                            top: 4,
                            right: 20,
                            bottom: 16,
                            left: 10,
                        }}
                    >
                        <defs>
                            <linearGradient
                                id="volumeBarGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.85} />
                                <stop offset="100%" stopColor="#10B981" stopOpacity={0.35} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--chakra-colors-border_primary)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            scale="band"
                            stroke="var(--chakra-colors-text_secondary)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={{ stroke: "var(--chakra-colors-border_primary)" }}
                            interval="preserveStartEnd"
                            minTickGap={45}
                            dy={6}
                            tickFormatter={(dateString: string) =>
                                formatNumericDate(new Date(dateString), i18n)
                            }
                        />
                        <YAxis
                            width={85}
                            domain={[0, "auto"]}
                            stroke="var(--chakra-colors-text_secondary)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={{ stroke: "var(--chakra-colors-border_primary)" }}
                            tickFormatter={(value: number) => Number(value).toLocaleString()}
                        />
                        <Bar
                            dataKey="volume"
                            maxBarSize={40}
                            minPointSize={6}
                            fill="url(#volumeBarGradient)"
                            stroke="#10B981"
                            strokeWidth={1}
                            strokeOpacity={0.6}
                            radius={[4, 4, 0, 0]}
                            name={t("securities_transactions_volume")}
                        />
                        <Tooltip content={<SecurityTransactionsVolumeTooltip />} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

export default SecurityTransactionsVolumeChart;
