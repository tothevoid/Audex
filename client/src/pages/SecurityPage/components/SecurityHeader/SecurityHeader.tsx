import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Card, Flex, HStack, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { SecurityEntity } from "../../../../models/securities/SecurityEntity";
import { SecurityStats } from "../../../../models/securities/SecurityStats";
import { getIconUrl } from "../../../../api/securities/securityApi";
import { formatMoneyByCurrencyCulture } from "../../../../shared/utilities/formatters/moneyFormatter";
import { formatShortDateTime } from "../../../../shared/utilities/formatters/dateFormatter";
import StoredIcon from "../../../../shared/components/StoredIcon";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import {
    BsBriefcase,
    BsBank,
    BsPiggyBank,
    BsBarChart,
    BsArrowDownLeft,
    BsArrowUpRight,
    BsClockHistory,
} from "react-icons/bs";
import { MdOutlinePayments } from "react-icons/md";

interface Props {
    security: SecurityEntity;
    securityStats: SecurityStats;
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    icon,
    label,
    value,
    valueColor = "text_primary",
}) => {
    return (
        <HStack
            p={3}
            borderRadius="lg"
            backgroundColor="background_secondary"
            borderColor="border_primary"
            borderWidth="1px"
            gap={3}
            alignItems="center"
            transition="all 0.2s ease"
            _hover={{ borderColor: "action_primary", backgroundColor: "background_primary" }}
        >
            <Box
                p={2}
                borderRadius="md"
                backgroundColor="background_primary"
                borderColor="border_primary"
                borderWidth="1px"
                color="text_secondary"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
            >
                {icon}
            </Box>
            <Stack gap={0.5} overflow="hidden">
                <Text
                    fontSize="11px"
                    fontWeight={600}
                    textTransform="uppercase"
                    letterSpacing="0.04em"
                    color="text_secondary"
                    lineClamp={1}
                >
                    {label}
                </Text>
                <Text fontSize="md" fontWeight={800} color={valueColor} lineClamp={1}>
                    {value}
                </Text>
            </Stack>
        </HStack>
    );
};

const SecurityHeader: React.FC<Props> = ({ security, securityStats }) => {
    const { t, i18n } = useTranslation();

    const { ticker, name, type, actualPrice, currency, iconKey, priceFetchedAt } = security;
    const iconUrl = iconKey ? getIconUrl(iconKey) : undefined;

    const holdingValue = securityStats.hasOnBrokerAccounts * actualPrice;
    const formattedPriceUpdate = priceFetchedAt
        ? formatShortDateTime(new Date(priceFetchedAt), i18n, false)
        : null;

    return (
        <Card.Root
            backgroundColor="background_primary"
            borderColor="border_primary"
            borderRadius="xl"
            mb={4}
            boxShadow="sm"
        >
            <Card.Body padding={5}>
                {/* Top Hero Bar: Security Identity & Actual Price */}
                <Flex
                    alignItems={{ base: "flex-start", sm: "center" }}
                    flexDirection={{ base: "column", sm: "row" }}
                    gap={{ base: 4, sm: 6 }}
                    flexWrap="wrap"
                    mb={4}
                >
                    {/* Left: Icon, Ticker, Name & Tags */}
                    <HStack gap={3.5} alignItems="center">
                        <StoredIcon
                            src={iconUrl}
                            fallbackIcon={<HiOutlineBuildingOffice2 size={24} color="var(--chakra-colors-text_secondary)" />}
                            size="lg"
                        />
                        <Stack gap={1}>
                            <HStack gap={2} flexWrap="wrap" alignItems="center">
                                <Text fontWeight={900} fontSize="2xl" color="text_primary" lineHeight="1">
                                    {ticker}
                                </Text>
                                <Text
                                    fontSize="xs"
                                    fontWeight={700}
                                    px={2.5}
                                    py={0.5}
                                    borderRadius="md"
                                    backgroundColor="action_primary"
                                    color="white"
                                >
                                    {type.name}
                                </Text>
                                <Text
                                    fontSize="xs"
                                    fontWeight={600}
                                    px={2}
                                    py={0.5}
                                    borderRadius="md"
                                    backgroundColor="background_secondary"
                                    borderColor="border_primary"
                                    borderWidth="1px"
                                    color="text_secondary"
                                >
                                    {currency.name}
                                </Text>
                            </HStack>
                            <Text fontSize="sm" color="text_secondary" fontWeight={500}>
                                {name}
                            </Text>
                        </Stack>
                    </HStack>

                    {/* Subtle Divider */}
                    <Box
                        height="40px"
                        width="1px"
                        backgroundColor="border_primary"
                        display={{ base: "none", sm: "block" }}
                    />

                    {/* Actual Price & Last Update */}
                    <Stack
                        alignItems="flex-start"
                        gap={0.5}
                    >
                        <Text
                            fontSize="11px"
                            fontWeight={600}
                            textTransform="uppercase"
                            letterSpacing="0.04em"
                            color="text_secondary"
                        >
                            {t("security_page_stats_actual_price")}
                        </Text>
                        <Text fontSize="2xl" fontWeight={900} color="text_primary" lineHeight="1.1">
                            {formatMoneyByCurrencyCulture(actualPrice, currency.name)}
                        </Text>
                        {formattedPriceUpdate && (
                            <HStack gap={1} color="text_secondary" fontSize="xs">
                                <Icon>
                                    <BsClockHistory size={11} />
                                </Icon>
                                <Text fontSize="xs">
                                    {t("security_page_last_price_update", { date: formattedPriceUpdate })}
                                </Text>
                            </HStack>
                        )}
                    </Stack>
                </Flex>

                {/* Metrics Grouped by Meaning */}
                <Stack pt={4} borderTopWidth="1px" borderColor="border_primary" gap={4}>
                    {/* Group 1: Portfolio Holdings */}
                    <Stack gap={2}>
                        <HStack gap={1.5} color="text_secondary">
                            <Icon color="text_secondary">
                                <BsBriefcase size={13} />
                            </Icon>
                            <Text
                                fontSize="xs"
                                fontWeight={700}
                                textTransform="uppercase"
                                letterSpacing="0.05em"
                                color="text_secondary"
                            >
                                {t("security_page_stats_group_portfolio")}
                            </Text>
                        </HStack>

                        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={3}>
                            <StatCard
                                icon={<BsBriefcase size={16} />}
                                label={t("security_page_stats_securities")}
                                value={`${securityStats.hasOnBrokerAccounts} ${t("security_page_stats_units")}`}
                            />
                            <StatCard
                                icon={<BsBank size={16} />}
                                label={t("security_page_stats_current_price")}
                                value={formatMoneyByCurrencyCulture(holdingValue, currency.name)}
                            />
                            <StatCard
                                icon={<MdOutlinePayments size={16} />}
                                label={t("security_page_stats_transactions_sum")}
                                value={formatMoneyByCurrencyCulture(securityStats.transactionsSum, currency.name)}
                            />
                            <StatCard
                                icon={<BsPiggyBank size={16} />}
                                label={t("security_page_stats_dividends_income")}
                                value={formatMoneyByCurrencyCulture(securityStats.dividendsIncome, currency.name)}
                                valueColor={securityStats.dividendsIncome > 0 ? "status_success" : "text_primary"}
                            />
                        </SimpleGrid>
                    </Stack>

                    {/* Group 2: Trade Price Analytics */}
                    <Stack gap={2}>
                        <HStack gap={1.5} color="text_secondary">
                            <Icon color="text_secondary">
                                <BsBarChart size={13} />
                            </Icon>
                            <Text
                                fontSize="xs"
                                fontWeight={700}
                                textTransform="uppercase"
                                letterSpacing="0.05em"
                                color="text_secondary"
                            >
                                {t("security_page_stats_group_transactions")}
                            </Text>
                        </HStack>

                        <SimpleGrid columns={{ base: 1, sm: 3, lg: 3 }} gap={3}>
                            <StatCard
                                icon={<BsBarChart size={16} />}
                                label={t("security_page_stats_transactions_avg")}
                                value={formatMoneyByCurrencyCulture(securityStats.transactionsAvg, currency.name)}
                            />
                            <StatCard
                                icon={<BsArrowDownLeft size={16} />}
                                label={t("security_page_stats_transactions_min")}
                                value={formatMoneyByCurrencyCulture(securityStats.transactionsMin, currency.name)}
                            />
                            <StatCard
                                icon={<BsArrowUpRight size={16} />}
                                label={t("security_page_stats_transactions_max")}
                                value={formatMoneyByCurrencyCulture(securityStats.transactionsMax, currency.name)}
                            />
                        </SimpleGrid>
                    </Stack>
                </Stack>
            </Card.Body>
        </Card.Root>
    );
};

export default SecurityHeader;
