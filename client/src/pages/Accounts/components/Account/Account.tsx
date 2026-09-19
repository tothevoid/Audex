import { Card, Flex, HStack, Link, Stack, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { ACCOUNT_TYPE } from '../../../../shared/constants/accountType';
import AccountIcon from '../../../../shared/components/AccountIcon';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';
import EntityCard from '../../../../shared/components/EntityCard/EntityCard';
import AccentBadge from '../../../../shared/components/AccentBadge/AccentBadge';

interface Props {
    account: AccountEntity;
    onTransferClicked: (account: AccountEntity) => void;
    onEditClicked: (account: AccountEntity) => void;
    onDeleteClicked: (account: AccountEntity) => void;
}

const Account = (props: Props) => {
    const { name, balance, currency, bank, accountType } = props.account;

    const isCash = accountType?.id === ACCOUNT_TYPE.CASH;
    const accountLink = isCash ? `../cash_account/${props.account.id}` : undefined;
    const bankName = bank?.name;

    return (
        <EntityCard h="full" display="flex" flexDirection="column" justifyContent="space-between">
            <Card.Body color="text_primary" p={4.5} flex="1" display="flex" flexDirection="column" justifyContent="space-between">
                <Stack gap={3}>
                    <Flex justify="space-between" align="flex-start" gap={2}>
                        <HStack gap={3} align="flex-start" minW={0} flex="1">
                            <AccountIcon account={props.account} size="lg" />
                            <Stack gap={0.5} minW={0} flex="1">
                                {isCash ? (
                                    <Link
                                        asChild
                                        color="text_primary"
                                        fontWeight="700"
                                        fontSize="md"
                                        lineHeight="1.3"
                                        lineClamp={2}
                                        title={name}
                                        textDecoration="none"
                                        _hover={{ color: "action_primary", textDecoration: "none" }}
                                    >
                                        <NavLink to={accountLink!}>{name}</NavLink>
                                    </Link>
                                ) : (
                                    <Text
                                        color="text_primary"
                                        fontWeight="700"
                                        fontSize="md"
                                        lineHeight="1.3"
                                        lineClamp={2}
                                        title={name}
                                    >
                                        {name}
                                    </Text>
                                )}
                                {bankName && (
                                    <Text fontSize="xs" color="text_secondary" fontWeight="500" truncate title={bankName}>
                                        {bankName}
                                    </Text>
                                )}
                            </Stack>
                        </HStack>

                        <CardActionButtons
                            size="xs"
                            onTransfer={() => props.onTransferClicked(props.account)}
                            onEdit={() => props.onEditClicked(props.account)}
                            onDelete={() => props.onDeleteClicked(props.account)}
                        />
                    </Flex>
                </Stack>

                <Flex justify="space-between" align="center" pt={3} borderTopWidth="1px" borderColor="border_primary" mt={3}>
                    {accountType?.name ? (
                        <AccentBadge variant="success">
                            {accountType.name}
                        </AccentBadge>
                    ) : <span />}
                    <Text fontSize="xl" fontWeight="900" letterSpacing="tight" color="text_primary">
                        {formatMoneyByCurrencyCulture(balance, currency?.name)}
                    </Text>
                </Flex>
            </Card.Body>
        </EntityCard>
    );
};

export default Account;