import { Button, Card, CardBody, Flex, Icon, Stack, Text } from '@chakra-ui/react';
import { MdDelete, MdEdit } from "react-icons/md";
import { useTranslation } from 'react-i18next';
import { DividendEntity } from '@/models/securities/DividendEntity';
import { formatDate } from '@/shared/utilities/formatters/dateFormatter';
import { formatMoneyByCurrencyCulture } from '@/shared/utilities/formatters/moneyFormatter';

interface Props {
    dividend: DividendEntity
    onEditClicked: (dividend: DividendEntity) => void
    onDeleteClicked: (dividend: DividendEntity) => void
}

const Dividend = (props: Props) => {
    const { amount, security, declarationDate, snapshotDate } = props.dividend;

    const { t, i18n } = useTranslation();
    return <Card.Root borderColor="border_primary" color="text_primary" backgroundColor="background_primary" 
        mt={5} mb={5} boxShadow={"sm"} _hover={{ boxShadow: "md" }}>
        <CardBody>
            <Flex justifyContent="space-between" alignItems="center">
                <Stack direction={'row'} alignItems="center">
                    <Stack ml={5}>
                        <Text>{t("entity_dividend_declaration_date")}: {formatDate(declarationDate, i18n)}</Text>
                        <Text>{t("entity_dividend_payment_date")}: {formatDate(snapshotDate, i18n)}</Text>
                    </Stack>
                </Stack>
                <Flex gap={2} justifyContent="space-between" alignItems="center">
                    <Text width={100}>{formatMoneyByCurrencyCulture(amount, security.currency.name)}</Text>
                    <Button background={'background_secondary'} size={'sm'} onClick={() => props.onEditClicked(props.dividend)}>
                        <Icon color="card_action_icon_primary">
                            <MdEdit/>
                        </Icon>
                    </Button>
                    <Button background={'background_secondary'} size={'sm'} onClick={() => props.onDeleteClicked(props.dividend)}>
                        <Icon color="card_action_icon_danger">
                            <MdDelete/>
                        </Icon>
                    </Button>
                </Flex>
            </Flex>
        </CardBody>
    </Card.Root>;
};

export default Dividend;