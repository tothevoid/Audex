import { Button, Card, CardBody, Flex, Icon, Stack, Text } from '@chakra-ui/react';
import { MdDelete, MdEdit } from "react-icons/md";
import { useTranslation } from 'react-i18next';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { formatDate } from '../../../../shared/utilities/formatters/dateFormatter';
import { DebtPaymentEntity } from '../../../../models/debts/DebtPaymentEntity';

type Props = {
    debtPayment: DebtPaymentEntity,
    onEditClicked: (debt: DebtPaymentEntity) => void,
    onDeleteClicked: (debt: DebtPaymentEntity) => void,
}

const DebtPayment = (props: Props) => {
    const { debt, date, amount, targetAccount, isPercentagePayment } = props.debtPayment;

    const { t, i18n } = useTranslation();

    const title = t("debt_payment_title", {
        amount: formatMoneyByCurrencyCulture(amount, debt.currency.name),
        debt: debt.name,
        account: targetAccount.name
    }) 

    return <Card.Root borderColor="border_primary" color="text_primary" backgroundColor="background_primary" 
            mt={5} mb={5} boxShadow={"sm"} _hover={{ boxShadow: "md" }}>
            <CardBody>
                <Flex justifyContent="space-between" alignItems="center">
                    <Stack direction={"row"} alignItems="center">
                        <Text textAlign={'center'} w={150} rounded={10} padding={1} background={'action_primary'} color="white">{formatDate(date, i18n, false)}</Text>
                        {isPercentagePayment && <Text textAlign={'center'} w={10} rounded={10} padding={1} background={'action_primary'} color="white">%</Text>}
                        <Text fontWeight={600}>{title}</Text>
                    </Stack>
                    <Flex gap={2} justifyContent="space-between" alignItems="center">
                        <Button background={'background_secondary'} size={'sm'} onClick={() => props.onEditClicked(props.debtPayment)}>
                            <Icon color="card_action_icon_primary">
                                <MdEdit/>
                            </Icon>
                        </Button>
                        <Button background={'background_secondary'} size={'sm'} onClick={() => props.onDeleteClicked(props.debtPayment)}>
                            <Icon color="card_action_icon_danger">
                                <MdDelete/>
                            </Icon>
                        </Button>
                    </Flex>
                </Flex>
            </CardBody>
        </Card.Root>
};

export default DebtPayment;