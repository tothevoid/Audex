import React from 'react';
import { Box, Flex, Span, Text } from '@chakra-ui/react';
import { PiCoinsLight } from 'react-icons/pi';
import { useTranslation } from 'react-i18next';
import { DividendEntity } from '@/models/securities/DividendEntity';
import { formatDate } from '@/shared/utilities/formatters/dateFormatter';
import { formatMoneyByCurrencyCulture } from '@/shared/utilities/formatters/moneyFormatter';
import CardActionButtons from '@/shared/components/CardActionButtons/CardActionButtons';
import EntityCard from '@/shared/components/EntityCard/EntityCard';

interface Props {
    dividend: DividendEntity;
    onEditClicked: (dividend: DividendEntity) => void;
    onDeleteClicked: (dividend: DividendEntity) => void;
}

const Dividend: React.FC<Props> = ({
    dividend,
    onEditClicked,
    onDeleteClicked
}) => {
    const { amount, security, declarationDate, snapshotDate } = dividend;
    const { t, i18n } = useTranslation();

    const currencyName = security?.currency?.name;

    return (
        <EntityCard p={3} my={2}>
            <Flex justifyContent="space-between" alignItems="center" gap={3}>
                {/* Left Section: Icon + Dividend Dates Info */}
                <Flex alignItems="center" gap={3} flex={1} minW={0}>
                    {/* Dividend Icon */}
                    <Flex
                        w={10}
                        h={10}
                        minW={10}
                        borderRadius="xl"
                        align="center"
                        justify="center"
                        backgroundColor="status_success_bg"
                    >
                        <PiCoinsLight size={20} color="var(--chakra-colors-gain)" />
                    </Flex>

                    {/* Dividend Details */}
                    <Box flex={1} minW={0}>
                        {/* Main line: Snapshot Date */}
                        <Text fontWeight={600} fontSize="sm" color="text_primary" truncate>
                            <Span color="text_secondary">{t("entity_dividend_snapshot_date")}: </Span>
                            <Span color="text_primary">{formatDate(snapshotDate, i18n)}</Span>
                        </Text>

                        {/* Subtitle: Declaration Date */}
                        <Text fontSize="2xs" color="text_secondary" mt={0.5}>
                            {t("entity_dividend_declaration_date")}: {formatDate(declarationDate, i18n)}
                        </Text>
                    </Box>
                </Flex>

                {/* Right Section: Amount + Actions */}
                <Flex alignItems="center" gap={3} flexShrink={0}>
                    <Box textAlign="right">
                        <Text
                            fontWeight={700}
                            fontSize="sm"
                            color="gain"
                            whiteSpace="nowrap"
                        >
                            +{formatMoneyByCurrencyCulture(amount, currencyName)}
                        </Text>

                        <Text fontSize="2xs" color="text_secondary" whiteSpace="nowrap">
                            {t("entity_dividend_security_amount")}
                        </Text>
                    </Box>

                    <CardActionButtons
                        size="xs"
                        onEdit={() => onEditClicked(dividend)}
                        onDelete={() => onDeleteClicked(dividend)}
                    />
                </Flex>
            </Flex>
        </EntityCard>
    );
};

export default Dividend;
