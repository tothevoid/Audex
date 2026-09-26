import React from 'react';
import { Badge, Box, Flex, HStack, Span, Text } from '@chakra-ui/react';
import { MdTrendingDown, MdTrendingUp } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { SecurityTransactionEntity } from '../../../../models/securities/SecurityTransactionEntity';
import { formatTime } from '../../../../shared/utilities/formatters/dateFormatter';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { getIconUrl } from '../../../../api/securities/securityApi';
import StoredIcon from '../../../../shared/components/StoredIcon';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';
import EntityCard from '../../../../shared/components/EntityCard/EntityCard';

interface Props {
    isGlobalBrokerAccount: boolean;
    securityTransaction: SecurityTransactionEntity;
    onEditClicked: (transaction: SecurityTransactionEntity) => void;
    onDeleteClicked: (transaction: SecurityTransactionEntity) => void;
}

const SecurityTransaction: React.FC<Props> = ({
    isGlobalBrokerAccount,
    securityTransaction,
    onEditClicked,
    onDeleteClicked
}) => {
    const {
        security,
        date,
        price,
        quantity,
        isSell,
        brokerCommission,
        stockExchangeCommission,
        tax,
        brokerAccount
    } = securityTransaction;

    const { t, i18n } = useTranslation();

    const iconUrl = security?.iconKey ? getIconUrl(security.iconKey) : undefined;
    const currencyName = security.currency.name;
    const grossTotal = price * quantity;

    const feeDetails: { label: string; amount: number }[] = [];
    if (brokerCommission > 0) {
        feeDetails.push({
            label: t("security_transaction_broker_commission_short"),
            amount: brokerCommission
        });
    }
    if (stockExchangeCommission > 0) {
        feeDetails.push({
            label: t("security_transaction_exchange_commission_short"),
            amount: stockExchangeCommission
        });
    }
    if (tax > 0) {
        feeDetails.push({
            label: t("security_transaction_tax_short"),
            amount: tax
        });
    }

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
                        {formatTime(date, i18n)}
                    </Badge>

                    {/* Security Avatar / Icon */}
                    <Flex
                        w={10}
                        h={10}
                        minW={10}
                        borderRadius="xl"
                        align="center"
                        justify="center"
                        backgroundColor={isSell ? 'status_success_bg' : 'status_danger_bg'}
                    >
                        <StoredIcon
                            src={iconUrl}
                            fallbackIcon={
                                isSell ? (
                                    <MdTrendingUp size={20} color="var(--chakra-colors-gain)" />
                                ) : (
                                    <MdTrendingDown size={20} color="var(--chakra-colors-loss)" />
                                )
                            }
                            size="sm"
                        />
                    </Flex>

                    {/* Security Details */}
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

                        {/* Subtitle: Quantity x Price */}
                        <HStack gap={2} mt={0.5} fontSize="2xs" color="text_secondary" flexWrap="wrap">
                            <Text>
                                <Span fontWeight="semibold" color="text_primary">
                                    {quantity} {t("security_page_stats_units")}
                                </Span>
                                {" × "}
                                <Span>{formatMoneyByCurrencyCulture(price, currencyName)}</Span>
                            </Text>
                        </HStack>
                    </Box>
                </Flex>

                {/* Right Section: Colored Amounts + All Individual Commissions + Actions */}
                <Flex alignItems="center" gap={3} flexShrink={0}>
                    <Box textAlign="right">
                        <Text
                            fontWeight={700}
                            fontSize="sm"
                            color={isSell ? "gain" : "loss"}
                            whiteSpace="nowrap"
                        >
                            {isSell ? "+" : "−"}
                            {formatMoneyByCurrencyCulture(grossTotal, currencyName)}
                        </Text>

                        {feeDetails.length > 0 && (
                            <HStack
                                gap={1.5}
                                justify="flex-end"
                                fontSize="2xs"
                                color="text_secondary"
                                whiteSpace="nowrap"
                                flexWrap="wrap"
                            >
                                {feeDetails.map((item, index) => (
                                    <React.Fragment key={item.label}>
                                        {index > 0 && <span>•</span>}
                                        <span>
                                            {item.label} {formatMoneyByCurrencyCulture(item.amount, currencyName)}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </HStack>
                        )}
                    </Box>

                    <CardActionButtons
                        size="xs"
                        onEdit={() => onEditClicked(securityTransaction)}
                        onDelete={() => onDeleteClicked(securityTransaction)}
                    />
                </Flex>
            </Flex>
        </EntityCard>
    );
};

export default SecurityTransaction;