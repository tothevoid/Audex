import { Card, Flex, Stack, Text } from '@chakra-ui/react';
import { Fragment } from 'react';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { CryptocurrencyEntity } from '../../../../models/crypto/CryptocurrencyEntity';
import { FaBitcoin } from "react-icons/fa";
import { getIconUrl } from '../../../../api/crypto/cryptocurrencyApi';
import StoredIcon from '../../../../shared/components/StoredIcon';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';

interface Props {
    cryptocurrency: CryptocurrencyEntity,
    onEditClicked: (cryptocurrency: CryptocurrencyEntity) => void,
    onDeletedClicked: (cryptocurrency: CryptocurrencyEntity) => void
}

const Cryptocurrency = (props: Props) => {
    const { name, symbol, price, iconKey } = props.cryptocurrency;

    const iconUrl = iconKey ? getIconUrl(iconKey) : undefined;

    return <Fragment>
        <Card.Root backgroundColor="background_primary" borderColor="border_primary" >
            <Card.Body color="text_primary" boxShadow={"sm"} _hover={{ boxShadow: "md" }} >
                <Flex justifyContent="space-between" alignItems="center">
                    <Stack>
                        <Stack justifyContent={"start"} direction="row" alignItems="center">
                            <StoredIcon
                                src={iconUrl}
                                fallbackIcon={<FaBitcoin size={20} color="#aaa" />}
                                size="md"
                            />
                            <Text fontSize="2xl" fontWeight={600} color="text_primary">{symbol}</Text>
                        </Stack>
                        <Text fontWeight={600}>{name}</Text>
                        <Text fontWeight={600}>1 {symbol} = {formatMoneyByCurrencyCulture(price, "USD")}</Text>
                    </Stack>
                    <CardActionButtons
                        size="sm"
                        onEdit={() => props.onEditClicked(props.cryptocurrency)}
                        onDelete={() => props.onDeletedClicked(props.cryptocurrency)}
                    />
                </Flex>
            </Card.Body>
        </Card.Root>
    </Fragment>
};

export default Cryptocurrency;