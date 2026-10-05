import React from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuTrendingUp, LuTrendingDown } from "react-icons/lu";
import { BsDropletFill } from "react-icons/bs";
import { getCurrencySymbol } from "@/shared/utilities/currencyUtils";
import { OilQuoteEntity } from "@/models/dashboard/widgets/oil/OilWidgetEntity";

interface OilQuoteCardProps {
    quote: OilQuoteEntity;
}

export const OilQuoteCard: React.FC<OilQuoteCardProps> = ({ quote }) => {
    const { i18n } = useTranslation();

    const isPositive = quote.change > 0;
    const isNegative = quote.change < 0;

    const changeColor = isPositive ? "gain" : isNegative ? "loss" : "text_secondary";
    const TrendIcon = isPositive ? LuTrendingUp : isNegative ? LuTrendingDown : null;

    const formattedPrice = quote.price.toLocaleString("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const formattedChange = Math.abs(quote.change).toLocaleString("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const formattedPercent = Math.abs(quote.changePercent).toFixed(2);
    const sign = isPositive ? "+" : isNegative ? "−" : "";

    const titleText = quote.symbol;

    const currencySymbol = getCurrencySymbol(quote.currency, i18n.language);

    const formattedTime = React.useMemo(() => {
        if (!quote.lastTradeTime || isNaN(quote.lastTradeTime.getTime()) || quote.lastTradeTime.getFullYear() <= 1970) {
            return "";
        }

        const now = new Date();
        const isToday =
            quote.lastTradeTime.getDate() === now.getDate() &&
            quote.lastTradeTime.getMonth() === now.getMonth() &&
            quote.lastTradeTime.getFullYear() === now.getFullYear();

        const lang = i18n.language || "ru";

        if (isToday) {
            return new Intl.DateTimeFormat(lang, {
                hour: "2-digit",
                minute: "2-digit"
            }).format(quote.lastTradeTime);
        }

        return new Intl.DateTimeFormat(lang, {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }).format(quote.lastTradeTime);
    }, [quote.lastTradeTime, i18n.language]);

    return (
        <Box
            p={3.5}
            borderRadius="xl"
            backgroundColor="background_secondary"
            borderWidth="1px"
            borderColor="border_primary"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            h="100%"
            transition="all 0.2s ease"
            _hover={{
                borderColor: "action_primary",
                transform: "translateY(-2px)",
                boxShadow: "sm"
            }}
        >
            {/* Centered Droplet Icon */}
            <Box
                w={14}
                h={14}
                borderRadius="full"
                backgroundColor="background_primary"
                borderWidth="1px"
                borderColor="border_primary"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="action_primary"
                fontSize="1.8rem"
                mb={2}
                boxShadow="xs"
            >
                <BsDropletFill />
            </Box>

            {/* Asset Name in Bold Caps (BRENT / WTI) */}
            <Text
                fontWeight="extrabold"
                fontSize="sm"
                letterSpacing="widest"
                color="text_secondary"
                lineHeight="1.2"
                mb={1}
            >
                {titleText}
            </Text>

            {/* Main Price (e.g. 102,60 $) */}
            <HStack gap={1.5} align="baseline" justify="center">
                <Text
                    fontSize="3xl"
                    fontWeight="extrabold"
                    color="text_primary"
                    letterSpacing="tight"
                    lineHeight="1.1"
                >
                    {formattedPrice}
                </Text>
                <Text fontSize="md" color="text_secondary" fontWeight="bold">
                    {currencySymbol}
                </Text>
            </HStack>

            {/* Diff & Trend */}
            <HStack gap={1} color={changeColor} fontSize="sm" fontWeight="semibold" mt={1.5} justify="center">
                {TrendIcon && <TrendIcon size={14} />}
                <Text fontSize="xs" fontWeight="semibold">
                    {sign}{formattedChange} ({sign}{formattedPercent}%)
                </Text>
            </HStack>

            {/* Source & Timestamp Footer */}
            {(quote.source || formattedTime) && (
                <HStack
                    gap={1.5}
                    fontSize="2xs"
                    color="text_secondary"
                    mt={2.5}
                    pt={2}
                    borderTopWidth="1px"
                    borderColor="border_primary"
                    w="100%"
                    justify="center"
                    opacity={0.8}
                >
                    {quote.source && (
                        <Text fontWeight="semibold" letterSpacing="wide">
                            {quote.source}
                        </Text>
                    )}
                    {quote.source && formattedTime && <Text opacity={0.6}>•</Text>}
                    {formattedTime && (
                        <Text>
                            {formattedTime}
                        </Text>
                    )}
                </HStack>
            )}
        </Box>
    );
};
