import { Card, Flex, Span, Stack, Text, CardBody, Button, Icon } from '@chakra-ui/react';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { MdEdit, MdDelete } from 'react-icons/md';
import { DividendPaymentEntity } from '../../../../models/brokers/DividendPaymentEntity';
import { formatDate } from '../../../../shared/utilities/formatters/dateFormatter';
import { useTranslation } from 'react-i18next';

interface Props {
    isGlobalBrokerAccount: boolean
	dividendPayment: DividendPaymentEntity
    onEditClicked: (dividendPayment: DividendPaymentEntity) => void
	onDeleteClicked: (dividendPayment: DividendPaymentEntity) => void
}

const DividendPayment = (props: Props) => {
	const { dividend, securitiesQuantity, tax} = props.dividendPayment;
    const paymentWithoutTax = securitiesQuantity * dividend.amount - tax;

    const { i18n } = useTranslation();

	return <Card.Root borderColor="border_primary" color="text_primary" backgroundColor="background_primary" 
        mt={5} mb={5} boxShadow={"sm"} _hover={{ boxShadow: "md" }}>
        <CardBody>
            <Flex justifyContent="space-between" alignItems="center">
                <Stack direction={'row'} alignItems="center">
                    <Text textAlign={'center'} w={150} rounded={10} padding={1} background={'action_primary'} color="white">{formatDate(props.dividendPayment.receivedAt, i18n, true)}</Text>
                    {
                        props.isGlobalBrokerAccount &&
                        <Text textAlign={'center'} w={150} rounded={10} padding={1} background={'action_primary'} color="white">{props.dividendPayment.brokerAccount?.name}</Text>
                    }
                    <Text fontWeight={700}>{dividend.security?.name} ({dividend.security?.ticker})</Text>
                </Stack>
                <Flex gap={2} justifyContent="space-between" alignItems="center">
                    <Text>
                        <Span>{formatMoneyByCurrencyCulture(paymentWithoutTax, dividend.security.currency.name)} </Span>
                        <Span pl={2.5} pr={2.5}>({formatMoneyByCurrencyCulture(dividend.amount, dividend.security.currency.name)} x {securitiesQuantity})</Span>
                    </Text>
                    <Button background={'background_secondary'} size={'sm'} onClick={() => props.onEditClicked(props.dividendPayment)}>
                        <Icon color="card_action_icon_primary">
                            <MdEdit/>
                        </Icon>
                    </Button>
                    <Button background={'background_secondary'} size={'sm'} onClick={() => props.onDeleteClicked(props.dividendPayment)}>
                        <Icon color="card_action_icon_danger">
                            <MdDelete/>
                        </Icon>
                    </Button>
                </Flex>
            </Flex>
        </CardBody>
    </Card.Root>
};

export default DividendPayment;