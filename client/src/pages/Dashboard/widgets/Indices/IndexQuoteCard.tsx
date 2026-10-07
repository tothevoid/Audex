import React from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuTrendingUp } from "react-icons/lu";
import TrendDiff from "@/shared/components/TrendDiff";
import { getCurrencySymbol } from "@/shared/utilities/currencyUtils";
import { formatAdaptiveNumber } from "@/shared/utilities/formatters/moneyFormatter";
import { formatAdaptiveDateTime } from "@/shared/utilities/formatters/dateFormatter";
import { MarketIndexQuoteEntity } from "@/models/dashboard/widgets/indices/IndicesWidgetEntity";

interface IndexQuoteCardProps {
    quote: MarketIndexQuoteEntity;
}

export const IndexQuoteCard: React.FC<IndexQuoteCardProps> = ({ quote }) => {
    const { i18n } = useTranslation();

    const formattedValue = formatAdaptiveNumber(quote.value, i18n.language, quote.decimals);

    const currencySymbol = getCurrencySymbol(quote.currency, i18n.language);

    const formattedTime = formatAdaptiveDateTime(quote.lastUpdateTime, i18n);

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
            {/* Centered Index Icon */}
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
                fontSize="1.5rem"
                mb={2}
                boxShadow="xs"
            >
                <LuTrendingUp />
            </Box>


            {/* Index Code (IMOEX / RTSI / RGBI / MCFTR) */}
            <Text
                fontWeight="extrabold"
                fontSize="sm"
                letterSpacing="widest"
                color="text_secondary"
                lineHeight="1.2"
                mb={0.5}
            >
                {quote.code}
            </Text>

            {/* Human-readable Name */}
            <Text
                fontSize="2xs"
                color="text_secondary"
                opacity={0.8}
                lineHeight="1.2"
                mb={1.5}
                maxW="180px"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                title={quote.shortName || quote.name}
            >
                {quote.shortName || quote.name}
            </Text>

            {/* Main Value */}
            <HStack gap={1.5} align="baseline" justify="center">
                <Text
                    fontSize="3xl"
                    fontWeight="extrabold"
                    color="text_primary"
                    letterSpacing="tight"
                    lineHeight="1.1"
                >
                    {formattedValue}
                </Text>
                {currencySymbol && (
                    <Text fontSize="md" color="text_secondary" fontWeight="bold">
                        {currencySymbol}
                    </Text>
                )}
            </HStack>

            {/* Diff & Trend */}
            <TrendDiff change={quote.changePoints} changePercent={quote.changePercent} />

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
