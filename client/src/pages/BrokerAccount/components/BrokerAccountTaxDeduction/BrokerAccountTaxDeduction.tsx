import { Card, Flex, Stack, Text, CardBody, Button, Icon } from '@chakra-ui/react';
import { formatDateTime } from '../../../../shared/utilities/formatters/dateFormatter';
import { useTranslation } from 'react-i18next';
import { MdDelete, MdEdit } from 'react-icons/md';
import { BrokerAccountTaxDeductionEntity } from '../../../../models/brokers/BrokerAccountTaxDeductionEntity';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';

interface Props {
    isGlobalBrokerAccount: boolean
    taxDeduction: BrokerAccountTaxDeductionEntity,
    onEditClicked: (taxDeduction: BrokerAccountTaxDeductionEntity) => void
    onDeleteClicked: (taxDeduction: BrokerAccountTaxDeductionEntity) => void
}

const BrokerAccountTaxDeduction = (props: Props) => {
    const { name, amount, dateApplied, brokerAccount} = props.taxDeduction;

    const { i18n } = useTranslation();

    return <Card.Root borderColor="border_primary" color="text_primary" backgroundColor="background_primary" 
        mt={5} mb={5} boxShadow={"sm"} _hover={{ boxShadow: "md" }}>
        <CardBody>
            <Flex justifyContent="space-between" alignItems="center">
                <Stack direction={'row'} alignItems="center">
                    <Text textAlign={'center'} w={225} rounded={10} padding={1} background={'action_primary'} color="white">{formatDateTime(dateApplied, i18n, true)}</Text>
                    {
                        props.isGlobalBrokerAccount &&
                        <Text textAlign={'center'} w={150} rounded={10} padding={1} background={'action_primary'} color="white">{props.taxDeduction.brokerAccount?.name}</Text>
                    }
                    <Text fontWeight={700}>{name}</Text>
                    <Text fontWeight={700}>{formatMoneyByCurrencyCulture(amount, brokerAccount.currency.name)}</Text>
                </Stack>
                <Flex gap={2} justifyContent="space-between" alignItems="center">
                    <Button background={'background_secondary'} size={'sm'} onClick={() => props.onEditClicked(props.taxDeduction)}>
                        <Icon color="card_action_icon_primary">
                            <MdEdit/>
                        </Icon>
                    </Button>
                    <Button background={'background_secondary'} size={'sm'} onClick={() => props.onDeleteClicked(props.taxDeduction)}>
                        <Icon color="card_action_icon_danger">
                            <MdDelete/>
                        </Icon>
                    </Button>
                </Flex>
            </Flex>
        </CardBody>
    </Card.Root>
};

export default BrokerAccountTaxDeduction;