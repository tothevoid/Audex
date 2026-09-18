import React from "react";
import { Box, Card, Flex, SimpleGrid, Text, Progress } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { DebtTagStatsEntity } from "../../../../models/debts/DebtTagEntity";
import { formatMoney, formatMoneyByCurrencyCulture } from "../../../../shared/utilities/formatters/moneyFormatter";
import DebtTagBadge from "../DebtTagBadge/DebtTagBadge";

interface Props {
    stats: DebtTagStatsEntity[];
    columns?: { base?: number; sm?: number; md?: number; lg?: number } | number;
}

export const DebtTagStatsCard: React.FC<Props> = ({ stats, columns = { base: 1, sm: 2 } }) => {
    const { t } = useTranslation();

    if (!stats || stats.length === 0) {
        return null;
    }

    return (
        <SimpleGrid columns={columns} gap={3}>
            {stats.map((stat) => (
                <Card.Root key={stat.tagId} backgroundColor="background_secondary" borderColor="border_primary" color="text_primary">
                    <Card.Body padding={3}>
                        <Flex justifyContent="space-between" alignItems="center" mb={2}>
                            <DebtTagBadge
                                name={stat.tagName}
                                colorHex={stat.colorHex}
                                px={2}
                                py={0.5}
                                borderRadius="md"
                                fontWeight="bold"
                            />
                            <Text fontSize="xs" color="text_secondary">
                                {stat.repaymentPercentage.toFixed(1)}%
                            </Text>
                        </Flex>

                        <Box mb={2}>
                            <Flex justifyContent="space-between" fontSize="xs" mb={1}>
                                <Text color="text_secondary">{t("debt_tag_stats_remaining")}:</Text>
                                <Text fontWeight="semibold">
                                    {stat.currencyName
                                        ? formatMoneyByCurrencyCulture(stat.remainingAmount, stat.currencyName)
                                        : formatMoney(stat.remainingAmount)}
                                </Text>
                            </Flex>
                            <Flex justifyContent="space-between" fontSize="xs" mb={1}>
                                <Text color="text_secondary">{t("debt_tag_stats_paid")}:</Text>
                                <Text color="gain" fontWeight="semibold">
                                    {stat.currencyName
                                        ? formatMoneyByCurrencyCulture(stat.totalPaid, stat.currencyName)
                                        : formatMoney(stat.totalPaid)}
                                </Text>
                            </Flex>
                            <Flex justifyContent="space-between" fontSize="xs">
                                <Text color="text_secondary">{t("debt_tag_stats_total")}:</Text>
                                <Text>
                                    {stat.currencyName
                                        ? formatMoneyByCurrencyCulture(stat.totalAmount, stat.currencyName)
                                        : formatMoney(stat.totalAmount)}
                                </Text>
                            </Flex>
                        </Box>

                        <Progress.Root defaultValue={stat.repaymentPercentage} colorPalette="green" size="xs">
                            <Progress.Track>
                                <Progress.Range />
                            </Progress.Track>
                        </Progress.Root>
                    </Card.Body>
                </Card.Root>
            ))}
        </SimpleGrid>
    );
};

export default DebtTagStatsCard;
