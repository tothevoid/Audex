import { Card, Flex, Stack, Text, Link } from '@chakra-ui/react';
import { Fragment } from 'react';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { getBankIconUrl } from '../../../../api/banks/bankApi';
import { ACCOUNT_TYPE } from '../../../../shared/constants/accountType';
import { BsCurrencyExchange, BsBank } from "react-icons/bs";
import StoredIcon from '../../../../shared/components/StoredIcon';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';
import EntityCard from '../../../../shared/components/EntityCard/EntityCard';

interface Props {
    account: AccountEntity,
    onTransferClicked: (account: AccountEntity) => void,
    onEditClicked: (account: AccountEntity) => void,
    onDeleteClicked: (account: AccountEntity) => void,
}

const Account = (props: Props) => {
    const {name, balance, currency, bank, accountType} = props.account;

    const renderIcon = () => {
        if (accountType?.id === ACCOUNT_TYPE.CASH) {
            return (
                <StoredIcon
                    fallbackIcon={<BsCurrencyExchange size={14} color="#aaa" />}
                    size="xs"
                />
            );
        }

        const iconUrl = bank?.iconKey ? getBankIconUrl(bank.iconKey) : undefined;
        return (
            <StoredIcon
                src={iconUrl}
                fallbackIcon={<BsBank size={14} color="#aaa" />}
                size="xs"
            />
        );
    };

    const renderTitle = () => {
        if (accountType?.id === ACCOUNT_TYPE.CASH) {
            return (
                <Link color="text_primary" href={`../cash_account/${props.account.id}`} fontWeight={600}>
                    {name}
                </Link>
            );
        }
        return <Text fontWeight={600}>{name}</Text>;
    };

    return <Fragment>
        <EntityCard>
            <Card.Body color="text_primary" p={4}>
                <Flex justifyContent="space-between" alignItems="center">
                    <Stack>
                        <Flex gapX={2} alignItems={"center"}>
                            {renderIcon()}
                            {renderTitle()}
                        </Flex>
                        <Text fontWeight={700}>{formatMoneyByCurrencyCulture(balance, currency.name)}</Text>
                    </Stack>
                    <CardActionButtons
                        size="sm"
                        onTransfer={() => props.onTransferClicked(props.account)}
                        onEdit={() => props.onEditClicked(props.account)}
                        onDelete={() => props.onDeleteClicked(props.account)}
                    />
                </Flex>
            </Card.Body>
        </EntityCard>
    </Fragment>
};

export default Account;