import React from 'react';
import { Badge, Box, Flex, HStack, Span, Text } from '@chakra-ui/react';
import { PiCoinsLight } from 'react-icons/pi';
import { useTranslation } from 'react-i18next';
import { DividendPaymentEntity } from '../../../../models/brokers/DividendPaymentEntity';
import { formatTime } from '../../../../shared/utilities/formatters/dateFormatter';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { getIconUrl } from '../../../../api/securities/securityApi';
import StoredIcon from '../../../../shared/components/StoredIcon';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';
import EntityCard from '../../../../shared/components/EntityCard/EntityCard';

interface Props {
    isGlobalBrokerAccount: boolean;
    dividendPayment: DividendPaymentEntity;
    onEditClicked: (dividendPayment: DividendPaymentEntity) => void;
    onDeleteClicked: (dividendPayment: DividendPaymentEntity) => void;
}

const DividendPayment: React.FC<Props> = ({
    isGlobalBrokerAccount,
    dividendPayment,
    onEditClicked,
    onDeleteClicked
}) => {
    const { dividend, securitiesQuantity, tax, receivedAt, brokerAccount } = dividendPayment;
    const { t, i18n } = useTranslation();

    const security = dividend.security;
    const currencyName = security?.currency?.name;
    const iconUrl = security?.iconKey ? getIconUrl(security.iconKey) : undefined;
    const paymentWithoutTax = securitiesQuantity * dividend.amount - tax;

    return (
        <EntityCard p={3} my={2}>
            <Flex justifyContent="space-between" alignItems="center" gap={3}>
                {/* Left Section: Time + Icon + Security Info */}
                <Flex alignItems="center" gap={3} flex={1} minW={0}>
                    {/* Left Time Badge */}
                    <Badge
                        size="sm"
                        variant="subtle"
                        backgroundColor="background_secondary"
                        color="text_secondary"
                        borderRadius="md"
                        px={2}
                        py={1}
                        fontSize="xs"
                        fontWeight="semibold"
                        letterSpacing="tight"
                        flexShrink={0}
                    >
                        {formatTime(receivedAt, i18n)}
                    </Badge>

                    {/* Security Avatar / Icon */}
                    <Flex
                        w={10}
                        h={10}
                        minW={10}
                        borderRadius="xl"
                        align="center"
                        justify="center"
                        backgroundColor="status_success_bg"
                    >
                        <StoredIcon
                            src={iconUrl}
                            fallbackIcon={<PiCoinsLight size={20} color="var(--chakra-colors-gain)" />}
                            size="sm"
                        />
                    </Flex>

                    {/* Dividend Details */}
                    <Box flex={1} minW={0}>
                        {/* Main line: Security Name + Ticker + Broker Account */}
                        <Flex align="center" gap={2} flexWrap="wrap">
                            <Text fontWeight={600} fontSize="sm" color="text_primary" truncate>
                                {security?.name || security?.ticker}
                            </Text>

                            {security?.ticker && (
                                <Badge
                                    size="xs"
                                    variant="subtle"
                                    backgroundColor="background_secondary"
                                    color="text_secondary"
                                    borderRadius="md"
                                    fontWeight="bold"
                                >
                                    {security.ticker}
                                </Badge>
                            )}

                            {isGlobalBrokerAccount && brokerAccount?.name && (
                                <Badge
                                    size="xs"
                                    variant="outline"
                                    borderColor="border_primary"
                                    color="text_secondary"
                                    borderRadius="md"
                                >
                                    {brokerAccount.name}
                                </Badge>
                            )}
                        </Flex>

                        {/* Subtitle: Quantity x Dividend Per Share */}
                        <HStack gap={2} mt={0.5} fontSize="2xs" color="text_secondary" flexWrap="wrap">
                            <Text>
                                <Span fontWeight="semibold" color="text_primary">
                                    {securitiesQuantity} {t("security_page_stats_units")}
                                </Span>
                                {" × "}
                                <Span>{formatMoneyByCurrencyCulture(dividend.amount, currencyName)}</Span>
                            </Text>
                        </HStack>
                    </Box>
                </Flex>

                {/* Right Section: Amount + Tax + Actions */}
                <Flex alignItems="center" gap={3} flexShrink={0}>
                    <Box textAlign="right">
                        <Text
                            fontWeight={700}
                            fontSize="sm"
                            color="gain"
                            whiteSpace="nowrap"
                        >
                            +{formatMoneyByCurrencyCulture(paymentWithoutTax, currencyName)}
                        </Text>

                        {tax > 0 && (
                            <Text fontSize="2xs" color="text_secondary" whiteSpace="nowrap">
                                {t("security_transaction_tax_short", { defaultValue: "налог" })}{" "}
                                {formatMoneyByCurrencyCulture(tax, currencyName)}
                            </Text>
                        )}
                    </Box>

                    <CardActionButtons
                        size="xs"
                        onEdit={() => onEditClicked(dividendPayment)}
                        onDelete={() => onDeleteClicked(dividendPayment)}
                    />
                </Flex>
            </Flex>
        </EntityCard>
    );
};

export default DividendPayment;