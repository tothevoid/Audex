import React from 'react';
import { Card, Flex, HStack, Stack, Text } from '@chakra-ui/react';
import { FaBitcoin } from "react-icons/fa";
import { getIconUrl } from '../../../../api/crypto/cryptocurrencyApi';
import { CryptocurrencyEntity } from '../../../../models/crypto/CryptocurrencyEntity';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import StoredIcon from '../../../../shared/components/StoredIcon';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';
import EntityCard from '../../../../shared/components/EntityCard/EntityCard';

interface Props {
    cryptocurrency: CryptocurrencyEntity,
    onEditClicked: (cryptocurrency: CryptocurrencyEntity) => void,
    onDeletedClicked: (cryptocurrency: CryptocurrencyEntity) => void
}

const Cryptocurrency: React.FC<Props> = (props: Props) => {
    const { name, symbol, price, iconKey } = props.cryptocurrency;
    const iconUrl = iconKey ? getIconUrl(iconKey) : undefined;

    return (
        <EntityCard h="full" display="flex" flexDirection="column" justifyContent="space-between">
            <Card.Body p={4} color="text_primary" flex="1" display="flex" flexDirection="column" justifyContent="space-between">
                <Stack gap={3}>
                    <Flex justify="space-between" align="center" gap={2}>
                        <HStack gap={3} align="center" minW={0} flex="1">
                            <StoredIcon
                                src={iconUrl}
                                fallbackIcon={<FaBitcoin size={24} color="#aaa" />}
                                size="lg"
                            />
                            <Stack gap={0.5} minW={0} flex="1">
                                <Text
                                    color="text_primary"
                                    fontWeight="700"
                                    fontSize="lg"
                                    letterSpacing="tight"
                                    truncate
                                    title={symbol}
                                >
                                    {symbol}
                                </Text>
                                <Text
                                    fontSize="xs"
                                    color="text_secondary"
                                    fontWeight="500"
                                    truncate
                                    title={name}
                                >
                                    {name}
                                </Text>
                            </Stack>
                        </HStack>

                        <CardActionButtons
                            onEdit={() => props.onEditClicked(props.cryptocurrency)}
                            onDelete={() => props.onDeletedClicked(props.cryptocurrency)}
                        />
                    </Flex>
                </Stack>

                <Flex justify="flex-end" align="center" pt={3} borderTopWidth="1px" borderColor="border_primary" mt={3}>
                    <Text fontSize="xl" fontWeight="900" letterSpacing="tight" color="text_primary">
                        {formatMoneyByCurrencyCulture(price, "USD")}
                    </Text>
                </Flex>
            </Card.Body>
        </EntityCard>
    );
};

export default Cryptocurrency;