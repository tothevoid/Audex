import React from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import TrendDiff from "@/shared/components/TrendDiff";
import { BrokerAccountDailySecurityStatsEntity } from "@/models/brokers/BrokerAccountDailyStatsEntity";
import { getCurrencySymbol } from "@/shared/utilities/currencyUtils";
import { getIconUrl } from "@/api/securities/securityApi";
import StoredIcon from "@/shared/components/StoredIcon";

interface SecurityDailyCardProps {
    stat: BrokerAccountDailySecurityStatsEntity;
}

export const SecurityDailyCard: React.FC<SecurityDailyCardProps> = ({
    stat
}) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const relativeStartPrice = stat.previousDayClosePrice || stat.startPrice;
    const change = stat.currentPrice - relativeStartPrice;
    const changePercent = relativeStartPrice > 0 ? (change / relativeStartPrice) * 100 : 0;

    const formattedPrice = stat.currentPrice.toLocaleString(i18n.language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const currencySymbol = getCurrencySymbol(stat.security.currency?.name, i18n.language);
    const iconUrl = stat.security.iconKey ? getIconUrl(stat.security.iconKey) : undefined;


    return (
        <Box
            p={3}
            borderRadius="xl"
            backgroundColor="background_secondary"
            borderWidth="1px"
            borderColor="border_primary"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            w="100%"
            h="100%"
            cursor="pointer"
            transition="all 0.2s ease"
            onClick={() => navigate(`/security/${stat.security.id}`)}
            _hover={{
                borderColor: "action_primary",
                transform: "translateY(-2px)",
                boxShadow: "sm"
            }}
        >
            {/* Centered Stock Icon in Circular Container */}
            <Box
                w={12}
                h={12}
                borderRadius="full"
                backgroundColor="background_primary"
                borderWidth="1px"
                borderColor="border_primary"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="action_primary"
                mb={2}
                boxShadow="xs"
                overflow="hidden"
            >
                <StoredIcon
                    src={iconUrl}
                    fallbackIcon={<HiOutlineBuildingOffice2 size={22} color="var(--chakra-colors-action_primary)" />}
                    size="md"
                />
            </Box>

            {/* Security Ticker in Bold Caps */}
            <Text
                fontWeight="extrabold"
                fontSize="sm"
                letterSpacing="widest"
                color="text_primary"
                lineHeight="1.2"
                mb={0.5}
                truncate
                maxW="100%"
            >
                {stat.security.ticker}
            </Text>

            {/* Security Name */}
            <Text
                fontSize="2xs"
                color="text_secondary"
                fontWeight="500"
                truncate
                maxW="100%"
                mb={1}
            >
                {stat.security.name}
            </Text>

            {/* Main Price */}
            <HStack gap={1} align="baseline" justify="center" maxW="100%">
                <Text
                    fontSize="2xl"
                    fontWeight="extrabold"
                    color="text_primary"
                    letterSpacing="tight"
                    lineHeight="1.1"
                >
                    {formattedPrice}
                </Text>
                <Text fontSize="sm" color="text_secondary" fontWeight="bold">
                    {currencySymbol}
                </Text>
            </HStack>

            {/* Diff & Trend */}
            <TrendDiff change={change} changePercent={changePercent} />

            {/* Footer: Position Quantity */}
            {stat.quantity > 0 && (
                <Box
                    fontSize="2xs"
                    color="text_secondary"
                    mt={2.5}
                    pt={2}
                    borderTopWidth="1px"
                    borderColor="border_primary"
                    w="100%"
                    textAlign="center"
                    opacity={0.8}
                >
                    <Text fontWeight="semibold" letterSpacing="wide">
                        {stat.quantity} {t("broker_account_security_card_pieces", "шт.")}
                    </Text>
                </Box>
            )}
        </Box>
    );
};
