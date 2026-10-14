import { Card, Flex, HStack, Stack, Text } from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaBitcoin } from 'react-icons/fa';
import { getIconUrl } from '@/api/crypto/cryptocurrencyApi';
import { CryptoAssetEntity } from '@/models/crypto/CryptoAssetEntity';
import { formatMoneyByCurrencyCulture } from '@/shared/utilities/formatters/moneyFormatter';
import StoredIcon from '@/shared/components/StoredIcon';
import EntityCard from '@/shared/components/EntityCard/EntityCard';
import CardActionButtons from '@/shared/components/CardActionButtons/CardActionButtons';

type Props = {
    cryptoAsset: CryptoAssetEntity;
    onEditClicked: (cryptoAsset: CryptoAssetEntity) => void;
    onDeleteClicked: (cryptoAsset: CryptoAssetEntity) => void;
};

const CryptoAsset: React.FC<Props> = ({
    cryptoAsset,
    onEditClicked,
    onDeleteClicked,
}) => {
    const { t } = useTranslation();

    if (!cryptoAsset || !cryptoAsset.cryptocurrency) {
        return null;
    }

    const { quantity = 0, cryptocurrency } = cryptoAsset;
    const iconUrl = cryptocurrency.iconKey ? getIconUrl(cryptocurrency.iconKey) : undefined;
    const totalValue = quantity * (cryptocurrency.price ?? 0);

    return (
        <EntityCard h="full" display="flex" flexDirection="column" justifyContent="space-between">
            <Card.Body p={4} color="text_primary" flex="1" display="flex" flexDirection="column" justifyContent="space-between">
                <Stack gap={3}>
                    <Flex justify="space-between" align="center" gap={2}>
                        <HStack gap={3} align="center" minW={0} flex="1">
                            <StoredIcon
                                src={iconUrl}
                                fallbackIcon={<FaBitcoin size={24} color="var(--chakra-colors-text_secondary)" />}
                                size="lg"
                            />
                            <Stack gap={0.5} minW={0} flex="1">
                                <Text
                                    color="text_primary"
                                    fontWeight="700"
                                    fontSize="lg"
                                    letterSpacing="tight"
                                    truncate
                                    title={cryptocurrency.symbol}
                                >
                                    {cryptocurrency.symbol}
                                </Text>
                                <Text
                                    fontSize="xs"
                                    color="text_secondary"
                                    fontWeight="500"
                                    truncate
                                    title={cryptocurrency.name}
                                >
                                    {cryptocurrency.name}
                                </Text>
                            </Stack>
                        </HStack>

                        <CardActionButtons
                            onEdit={() => onEditClicked(cryptoAsset)}
                            onDelete={() => onDeleteClicked(cryptoAsset)}
                        />
                    </Flex>
                </Stack>

                <Flex justify="space-between" align="flex-end" pt={3} borderTopWidth="1px" borderColor="border_primary" mt={3}>
                    <Stack gap={0}>
                        <Text fontSize="2xs" color="text_secondary">
                            {t("crypto_asset_quantity", t("crypto_account_cryptocurrency_quantity"))}
                        </Text>
                        <Text fontSize="sm" fontWeight="700" color="text_primary">
                            {quantity} {cryptocurrency.symbol}
                        </Text>
                    </Stack>

                    <Stack gap={0} align="flex-end">
                        <Text fontSize="2xs" color="text_secondary">
                            {t("crypto_asset_total_value", t("crypto_account_cryptocurrency_total_value"))}
                        </Text>
                        <Text fontSize="xl" fontWeight="900" letterSpacing="tight" color="text_primary">
                            {formatMoneyByCurrencyCulture(totalValue, "USD")}
                        </Text>
                    </Stack>
                </Flex>
            </Card.Body>
        </EntityCard>
    );
};

export default CryptoAsset;
