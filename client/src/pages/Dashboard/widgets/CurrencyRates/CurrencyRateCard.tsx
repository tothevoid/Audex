import React from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { CurrencyEntity } from "@/models/currencies/CurrencyEntity";
import { getCurrencySymbol } from "@/shared/utilities/currencyUtils";

interface CurrencyRateCardProps {
    currency: CurrencyEntity;
    userCurrencyName?: string;
}

export const CurrencyRateCard: React.FC<CurrencyRateCardProps> = ({
    currency,
    userCurrencyName
}) => {
    const { i18n } = useTranslation();

    const rateDecimals = currency.rate < 1 ? 4 : currency.rate < 10 ? 3 : 2;
    const formattedRate = currency.rate.toLocaleString(i18n.language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: rateDecimals
    });

    const currencySymbol = getCurrencySymbol(currency.name, i18n.language);
    const userCurrencySymbol = getCurrencySymbol(userCurrencyName || "", i18n.language);

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
            transition="all 0.2s ease"
            _hover={{
                borderColor: "action_primary",
                transform: "translateY(-2px)",
                boxShadow: "sm"
            }}
        >
            {/* Centered Currency Icon in Circular Container */}
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
            >
                <Text fontSize="xl" fontWeight="black" lineHeight={1} userSelect="none">
                    {currencySymbol}
                </Text>
            </Box>

            {/* Currency Code in Bold Caps */}
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
                {currency.name}
            </Text>

            {/* Pair Subtitle */}
            <Text
                fontSize="2xs"
                color="text_secondary"
                fontWeight="500"
                truncate
                maxW="100%"
                mb={1}
            >
                {currency.name} / {userCurrencyName}
            </Text>

            {/* Main Rate in User's Currency */}
            <HStack gap={1} align="baseline" justify="center" maxW="100%">
                <Text
                    fontSize="2xl"
                    fontWeight="extrabold"
                    color="text_primary"
                    letterSpacing="tight"
                    lineHeight="1.1"
                >
                    {formattedRate}
                </Text>
                <Text fontSize="sm" color="text_secondary" fontWeight="bold">
                    {userCurrencySymbol}
                </Text>
            </HStack>

            {/* Footer: Unit Ratio */}
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
                    1 {currency.name} = {formattedRate} {userCurrencySymbol}
                </Text>
            </Box>
        </Box>
    );
};

export default CurrencyRateCard;
