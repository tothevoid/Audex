import { Button, Card, CardBody, Flex, Icon, Span, Stack, Text } from '@chakra-ui/react';
import { MdDelete, MdEdit } from "react-icons/md";
import { useTranslation } from 'react-i18next';
import { SecurityTransactionEntity } from '../../../../models/securities/SecurityTransactionEntity';
import { formatDateTime } from '../../../../shared/utilities/formatters/dateFormatter';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';

interface Props {
    isGlobalBrokerAccount: boolean
    securityTransaction: SecurityTransactionEntity
    onEditClicked: (account: SecurityTransactionEntity) => void
    onDeleteClicked: (account: SecurityTransactionEntity) => void
}

const SecurityTransaction = (props: Props) => {
    const { security, date, price, quantity, isSell } = props.securityTransaction;

    const { i18n } = useTranslation();

    const bgColorTheme = isSell ? "sell_action_bg": "buy_action_bg"

    return <Card.Root borderColor="border_primary" color="text_primary" backgroundColor="background_primary" 
        mt={5} mb={5} boxShadow={"sm"} _hover={{ boxShadow: "md" }}>
        <CardBody>
            <Flex justifyContent="space-between" alignItems="center">
                <Stack direction={'row'} alignItems="center">
                    <Text textAlign={'center'} w={225} rounded={10} padding={1} background={bgColorTheme} color="white">{formatDateTime(date, i18n, true)}</Text>
                    {
                        props.isGlobalBrokerAccount &&
                        <Text textAlign={'center'} w={150} rounded={10} padding={1} background={bgColorTheme} color="white">{props.securityTransaction.brokerAccount?.name}</Text>
                    }
                    <Text fontWeight={700}>{security?.name} ({security?.ticker})</Text>
                </Stack>
                <Flex gap={2} justifyContent="space-between" alignItems="center">
                    <Text>
                        <Span>{formatMoneyByCurrencyCulture(price * quantity, security.currency.name)} </Span>
                        <Span pl={2.5} pr={2.5}>({formatMoneyByCurrencyCulture(price, security.currency.name)} x {quantity})</Span>
                    </Text>
                    <Button background={'background_secondary'} size={'sm'} onClick={() => props.onEditClicked(props.securityTransaction)}>
                        <Icon color="card_action_icon_primary">
                            <MdEdit/>
                        </Icon>
                    </Button>
                    <Button background={'background_secondary'} size={'sm'} onClick={() => props.onDeleteClicked(props.securityTransaction)}>
                        <Icon color="card_action_icon_danger">
                            <MdDelete/>
                        </Icon>
                    </Button>
                </Flex>
            </Flex>
        </CardBody>
    </Card.Root>
};

export default SecurityTransaction;