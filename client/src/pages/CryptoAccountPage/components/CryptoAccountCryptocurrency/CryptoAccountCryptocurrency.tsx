import { Card, Flex, HStack, Stack, Text } from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaBitcoin } from 'react-icons/fa';
import { getIconUrl } from '../../../../api/crypto/cryptocurrencyApi';
import { CryptoAccountCryptocurrencyEntity } from '../../../../models/crypto/CryptoAccountCryptocurrencyEntity';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import StoredIcon from '../../../../shared/components/StoredIcon';
import EntityCard from '../../../../shared/components/EntityCard/EntityCard';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';
import AccentBadge from '../../../../shared/components/AccentBadge/AccentBadge';

type Props = {
    cryptoAccountCryptocurrency: CryptoAccountCryptocurrencyEntity;
    onReloadCryptoAccountCryptocurrencies: () => void;
    onEditClicked: (cryptoAccountCryptocurrency: CryptoAccountCryptocurrencyEntity) => void;
    onDeleteClicked: (cryptoAccountCryptocurrency: CryptoAccountCryptocurrencyEntity) => void;
};

const CryptoAccountCryptocurrency: React.FC<Props> = ({
    cryptoAccountCryptocurrency,
    onEditClicked,
    onDeleteClicked,
}) => {
    const { quantity, cryptocurrency } = cryptoAccountCryptocurrency;
    const { t } = useTranslation();

    const iconUrl = cryptocurrency.iconKey ? getIconUrl(cryptocurrency.iconKey) : undefined;
    const totalValue = quantity * cryptocurrency.price;

    return (
        <EntityCard>
            <Card.Body color="text_primary" p={4.5}>
                <Stack spaceY={3.5}>
                    <Flex justify="space-between" align="flex-start" gap={2}>
                        <HStack gap={3} align="flex-start" minW={0} flex="1">
                            <StoredIcon
                                src={iconUrl}
                                fallbackIcon={<FaBitcoin size={22} color="#aaa" />}
                                size="lg"
                            />
                            <Stack gap={0.5} minW={0} flex="1">
                                <Text
                                    color="text_primary"
                                    fontWeight="700"
                                    fontSize="md"
                                    lineHeight="1.3"
                                    lineClamp={2}
                                    title={cryptocurrency.name}
                                >
                                    {cryptocurrency.name}
                                </Text>
                                <Flex gap={1.5} align="center">
                                    <AccentBadge variant="success">
                                        {cryptocurrency.symbol}
                                    </AccentBadge>
                                </Flex>
                            </Stack>
                        </HStack>

                        <CardActionButtons
                            size="sm"
                            onEdit={() => onEditClicked(cryptoAccountCryptocurrency)}
                            onDelete={() => onDeleteClicked(cryptoAccountCryptocurrency)}
                        />
                    </Flex>

                    <Flex justify="space-between" align="baseline" pt={1}>
                        <Stack spaceY={0}>
                            <Text fontSize="xs" color="text_secondary" fontWeight="medium">
                                {t("crypto_account_cryptocurrency_quantity")}
                            </Text>
                            <Text fontSize="md" fontWeight="bold" color="text_primary">
                                {quantity} {cryptocurrency.symbol}
                            </Text>
                            <Text fontSize="2xs" color="text_secondary">
                                1 {cryptocurrency.symbol} = {formatMoneyByCurrencyCulture(cryptocurrency.price, "USD")}
                            </Text>
                        </Stack>

                        <Stack spaceY={0} align="flex-end">
                            <Text fontSize="xs" color="text_secondary" fontWeight="medium">
                                {t("crypto_account_cryptocurrency_total_value")}
                            </Text>
                            <Text fontSize="2xl" fontWeight="900" letterSpacing="tight" color="text_primary">
                                {formatMoneyByCurrencyCulture(totalValue, "USD")}
                            </Text>
                        </Stack>
                    </Flex>
                </Stack>
            </Card.Body>
        </EntityCard>
    );
};

export default CryptoAccountCryptocurrency;