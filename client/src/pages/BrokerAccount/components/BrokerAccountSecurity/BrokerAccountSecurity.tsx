import { Card, Flex, Link, Stack, Text, Box, Button } from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import { FiTrendingUp, FiTrendingDown, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { TbArrowDownLeft, TbArrowUpRight } from 'react-icons/tb';
import { getIconUrl } from '../../../../api/securities/securityApi';
import { BrokerAccountSecurityEntity } from '../../../../models/brokers/BrokerAccountSecurityEntity';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import StoredIcon from '../../../../shared/components/StoredIcon';

type Props = {
    brokerAccountSecurity: BrokerAccountSecurityEntity;
};

export const BrokerAccountSecurity = ({ brokerAccountSecurity }: Props) => {
    const { price, quantity, security, soldPrice, soldQuantity } = brokerAccountSecurity;
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const quantityNow = quantity - soldQuantity;
    const actualPrice = security.actualPrice * quantityNow;
    const profitAndLoss = actualPrice - price + soldPrice;
    const percentage = price ? (profitAndLoss / price) * 100 : 100;
    const isPositive = profitAndLoss >= 0;

    const soldRatio = quantity > 0 ? (soldQuantity / quantity) * 100 : 0;
    const heldRatio = 100 - soldRatio;

    const avgBuyPrice = quantity > 0 ? price / quantity : 0;
    const avgSellPrice = soldQuantity > 0 ? soldPrice / soldQuantity : 0;

    const pnlColor = isPositive ? "pnl_positive" : "pnl_negative";
    const pnlBgColor = isPositive ? "pnl_positive_bg" : "pnl_negative_bg";
    const pnlBorderColor = isPositive ? "pnl_positive_border" : "pnl_negative_border";

    const securityLink = `../security/${security.id}`;

    const iconUrl = security.iconKey ? getIconUrl(security.iconKey) : undefined;

    return (
        <Card.Root
            backgroundColor="background_primary"
            borderColor="border_primary"
            overflow="hidden"
            position="relative"
            transition="transform 0.2s, box-shadow 0.2s"
            _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
        >
            <Box h="3px" bg={pnlColor} w="full" />

            <Card.Body color="text_primary" p={4.5}>
                <Stack spaceY={3.5}>
                    <Flex justify="space-between" align="flex-start">
                        <Flex align="flex-start" gap={3} flex="1" minW={0}>
                            <StoredIcon
                                src={iconUrl}
                                fallbackIcon={<HiOutlineBuildingOffice2 size={22} color="#aaa" />}
                                size="lg"
                            />
                            <Stack gap={0.5} minW={0} flex="1">
                                <Link color="text_primary" href={securityLink} fontSize="lg" fontWeight="900" letterSpacing="tight" truncate title={security?.ticker}>
                                    {security?.ticker}
                                </Link>
                                <Text fontSize="xs" color="gray.400" fontWeight="500" truncate title={security?.name}>
                                    {security?.name}
                                </Text>
                            </Stack>
                        </Flex>

                        <Box
                            bg={pnlBgColor}
                            px={3}
                            py={1.5}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor={pnlBorderColor}
                        >
                            <Flex align="center" gap={1.5} color={pnlColor}>
                                {isPositive ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
                                <Text fontSize="sm" fontWeight="bold">
                                    {isPositive ? "+" : ""}{percentage.toFixed(2)}%
                                </Text>
                            </Flex>
                        </Box>
                    </Flex>

                    <Box spaceY={1}>
                        <Flex justify="space-between" fontSize="2xs" color="gray.400">
                            <Text>{t("broker_account_security_card_in_stock")}: {quantityNow} ({heldRatio.toFixed(0)}%)</Text>
                            {soldQuantity > 0 && <Text>{t("broker_account_security_card_sold")}: {soldQuantity} ({soldRatio.toFixed(0)}%)</Text>}
                        </Flex>
                        <Flex h="6px" w="full" borderRadius="full" overflow="hidden" bg="gray.800">
                            <Box h="full" w={`${heldRatio}%`} bg="blue.500" transition="width 0.3s" />
                            {soldRatio > 0 && <Box h="full" w={`${soldRatio}%`} bg="orange.400" transition="width 0.3s" />}
                        </Flex>
                    </Box>

                    <Flex justify="space-between" align="baseline">
                        <Stack spaceY={0}>
                            <Text fontSize="xs" color="gray.400" fontWeight="medium">
                                {t("broker_account_security_card_security_on_account")}
                            </Text>
                            <Text fontSize="2xl" fontWeight="900" letterSpacing="tight">
                                {formatMoneyByCurrencyCulture(actualPrice, security?.currency?.name)}
                            </Text>
                        </Stack>

                        <Stack spaceY={0} align="flex-end">
                            <Text fontSize="2xs" color="gray.400">{t("broker_account_security_card_security_p&l")}</Text>
                            <Text fontSize="md" fontWeight="bold" color={pnlColor}>
                                {isPositive ? "+" : ""}{formatMoneyByCurrencyCulture(profitAndLoss, security?.currency?.name)}
                            </Text>
                        </Stack>
                    </Flex>

                    <Button
                        variant="subtle"
                        size="xs"
                        width="full"
                        onClick={() => setIsOpen(!isOpen)}
                        color="gray.400"
                        bg="transparent"
                        _hover={{ bg: "rgba(255,255,255,0.06)", color: "text_primary" }}
                    >
                        <Flex align="center" gap={1.5}>
                            <Text fontSize="2xs">{t("broker_account_security_card_details")}</Text>
                            {isOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                        </Flex>
                    </Button>

                    {isOpen && (
                        <Stack spaceY={2} pt={2} borderTopWidth="1px" borderColor="border_primary" fontSize="xs">
                            <Flex justify="space-between" align="center" p={2} bg="rgba(59, 130, 246, 0.08)" borderRadius="md">
                                <Flex align="center" gap={1.5} color="blue.400">
                                    <TbArrowDownLeft size={16} />
                                    <Text fontWeight="bold">{t("broker_account_security_card_security_initial_price")}</Text>
                                </Flex>
                                <Box textAlign="right">
                                    <Text fontWeight="bold">
                                        {quantity} {t("broker_account_security_card_pieces")} ({formatMoneyByCurrencyCulture(price, security?.currency?.name)})
                                    </Text>
                                    <Text fontSize="2xs" color="gray.400">
                                        {t("broker_account_security_card_avg_buy")}: {formatMoneyByCurrencyCulture(avgBuyPrice, security?.currency?.name)}
                                    </Text>
                                </Box>
                            </Flex>

                            <Flex justify="space-between" align="center" p={2} bg="rgba(249, 115, 22, 0.08)" borderRadius="md">
                                <Flex align="center" gap={1.5} color="orange.400">
                                    <TbArrowUpRight size={16} />
                                    <Text fontWeight="bold">{t("broker_account_security_card_security_sold_quantity")}</Text>
                                </Flex>
                                <Box textAlign="right">
                                    <Text fontWeight="bold">
                                        {soldQuantity} {t("broker_account_security_card_pieces")} ({formatMoneyByCurrencyCulture(soldPrice, security?.currency?.name)})
                                    </Text>
                                    <Text fontSize="2xs" color="gray.400">
                                        {t("broker_account_security_card_avg_sell")}: {formatMoneyByCurrencyCulture(avgSellPrice, security?.currency?.name)}
                                    </Text>
                                </Box>
                            </Flex>
                        </Stack>
                    )}
                </Stack>
            </Card.Body>
        </Card.Root>
    );
};

export default BrokerAccountSecurity;