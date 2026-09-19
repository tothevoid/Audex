import { Card, Flex, HStack, Link, Stack, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { SiBinance } from 'react-icons/si';
import { CryptoAccountEntity } from '../../../../models/crypto/CryptoAccountEntity';
import { getTotalBalance } from '../../../../api/crypto/cryptoAccountCryptocurrencyApi';
import { getCryptoProviderIconUrl } from '../../../../api/crypto/cryptoProviderApi';
import StoredIcon from '../../../../shared/components/StoredIcon/StoredIcon';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';
import EntityCard from '../../../../shared/components/EntityCard/EntityCard';
import AccentBadge from '../../../../shared/components/AccentBadge/AccentBadge';

interface Props {
    cryptoAccount: CryptoAccountEntity;
    onEditClicked: (cryptoAccount: CryptoAccountEntity) => void;
    onDeleteClicked: (cryptoAccount: CryptoAccountEntity) => void;
}

const CryptoAccount = (props: Props) => {
    const { id, name, cryptoProvider } = props.cryptoAccount;
    const accountLink = `../crypto_account/${id}`;

    const [totalAmount, setTotalAmount] = useState<number>(0);

    const fetchBalance = useCallback(async () => {
        const balance = await getTotalBalance(id);
        setTotalAmount(balance);
    }, [id]);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    return (
        <Fragment>
            <EntityCard h="full" display="flex" flexDirection="column" justifyContent="space-between">
                <Card.Body p={4} color="text_primary" flex="1" display="flex" flexDirection="column" justifyContent="space-between">
                    <Stack gap={3}>
                        <Flex justify="space-between" align="center" gap={2}>
                            <HStack gap={3} align="center" minW={0} flex="1">
                                <StoredIcon
                                    src={cryptoProvider?.iconKey ? getCryptoProviderIconUrl(cryptoProvider.iconKey) : undefined}
                                    fallbackIcon={<SiBinance size={22} color="var(--chakra-colors-text_secondary)" />}
                                    size="lg"
                                    title={cryptoProvider?.name}
                                />
                                <Stack gap={0.5} minW={0} flex="1">
                                    <Link
                                        asChild
                                        fontSize="md"
                                        fontWeight="700"
                                        lineHeight="1.3"
                                        lineClamp={2}
                                        color="text_primary"
                                        textDecoration="none"
                                        _hover={{ color: "action_primary", textDecoration: "none" }}
                                        title={name}
                                    >
                                        <NavLink to={accountLink}>{name}</NavLink>
                                    </Link>
                                </Stack>
                            </HStack>
                            <CardActionButtons
                                size="sm"
                                onEdit={() => props.onEditClicked(props.cryptoAccount)}
                                onDelete={() => props.onDeleteClicked(props.cryptoAccount)}
                            />
                        </Flex>
                    </Stack>

                    <Flex justify="space-between" align="center" pt={3} borderTopWidth="1px" borderColor="border_primary" mt={3}>
                        <AccentBadge variant="neutral">
                            {cryptoProvider?.name ?? "Crypto"}
                        </AccentBadge>
                        <Text fontSize="xl" fontWeight="900" letterSpacing="tight" color="text_primary">
                            {formatMoneyByCurrencyCulture(totalAmount, "USD")}
                        </Text>
                    </Flex>
                </Card.Body>
            </EntityCard>
        </Fragment>
    );
};

export default CryptoAccount;