import React from 'react';
import { Box, HStack, Icon, Text } from '@chakra-ui/react';
import { MdArrowForward } from 'react-icons/md';
import { formatMoneyByCurrencyCulture } from '@/shared/utilities/formatters/moneyFormatter';

interface ExchangePreviewProps {
    spentAmount: number;
    sourceCurrency?: string;
    receivedAmount: number;
    destCurrency?: string;
    rate: number;
}

export const ExchangePreview: React.FC<ExchangePreviewProps> = ({
    spentAmount,
    sourceCurrency,
    receivedAmount,
    destCurrency,
    rate,
}) => {
    if (receivedAmount <= 0 || rate <= 0 || !sourceCurrency || !destCurrency) {
        return null;
    }

    return (
        <Box
            p={2.5}
            borderRadius="lg"
            backgroundColor="background_secondary"
            borderWidth="1px"
            borderColor="border_primary"
        >
            <HStack gap={2} fontSize="xs" color="text_secondary" justify="center" wrap="wrap">
                <Text color="text_primary" fontWeight="600">
                    {formatMoneyByCurrencyCulture(spentAmount, sourceCurrency)}
                </Text>
                <Icon fontSize="xs">
                    <MdArrowForward />
                </Icon>
                <Text color="pnl_positive" fontWeight="700">
                    {formatMoneyByCurrencyCulture(receivedAmount, destCurrency)}
                </Text>
                <Text color="text_secondary">
                    • 1 {destCurrency} = {formatMoneyByCurrencyCulture(rate, sourceCurrency)}
                </Text>
            </HStack>
        </Box>
    );
};

export default ExchangePreview;
