import React from 'react';
import { Flex, HStack, Icon, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdArrowForward, MdCalendarToday } from "react-icons/md";
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { formatDate } from '../../../../shared/utilities/formatters/dateFormatter';
import { DebtPaymentEntity } from '../../../../models/debts/DebtPaymentEntity';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';
import AccentBadge from '../../../../shared/components/AccentBadge/AccentBadge';
import AccountIcon from '../../../../shared/components/AccountIcon';

interface Props {
    debtPayment: DebtPaymentEntity;
    isLast?: boolean;
    onEditClicked: (debt: DebtPaymentEntity) => void;
    onDeleteClicked: (debt: DebtPaymentEntity) => void;
}

const DebtPayment: React.FC<Props> = ({
    debtPayment,
    isLast = false,
    onEditClicked,
    onDeleteClicked,
}) => {
    const { t, i18n } = useTranslation();
    const { debt, date, amount, targetAccount, isPercentagePayment } = debtPayment;

    return (
        <Flex
            py={3}
            px={4}
            alignItems="center"
            justifyContent="space-between"
            flexWrap={{ base: 'wrap', md: 'nowrap' }}
            gap={3}
            borderBottomWidth={isLast ? '0px' : '1px'}
            borderColor="border_primary"
            transition="background 0.15s ease"
            _hover={{ bg: 'background_secondary' }}
        >
            {/* Left: Date & Payment Type Badge */}
            <HStack gap={3} w={{ base: '100%', md: '285px' }} flexShrink={0}>
                <HStack gap={1.5} color="text_secondary" fontSize="xs" w="155px" flexShrink={0}>
                    <Icon size="xs" color="text_secondary">
                        <MdCalendarToday />
                    </Icon>
                    <Text fontWeight={500} color="text_secondary" whiteSpace="nowrap">
                        {formatDate(date, i18n, true)}
                    </Text>
                </HStack>

                <AccentBadge
                    variant={isPercentagePayment ? 'warning' : 'success'}
                    size="sm"
                    w="115px"
                    justifyContent="center"
                    textAlign="center"
                    flexShrink={0}
                    fontSize="2xs"
                    py={0.5}
                    px={2}
                >
                    {isPercentagePayment ? t('debt_payment_type_interest') : t('debt_payment_type_principal')}
                </AccentBadge>
            </HStack>

            {/* Center: Debt Name ──► Target Account */}
            <Flex
                alignItems="center"
                gap={2}
                flex={1}
                minW={0}
                flexWrap={{ base: 'wrap', sm: 'nowrap' }}
            >
                <Text
                    fontWeight={600}
                    fontSize="sm"
                    color="text_primary"
                    truncate
                    title={debt.name}
                >
                    {debt.name}
                </Text>

                <HStack gap={1.5} color="text_secondary" fontSize="xs" flexShrink={0} alignItems="center">
                    <Icon color="text_secondary" size="xs">
                        <MdArrowForward />
                    </Icon>
                    <AccountIcon account={targetAccount} size="xs" shape="circle" />
                    <Text
                        fontWeight={500}
                        color="text_secondary"
                        truncate
                        maxW={{ base: '140px', sm: '180px', md: '260px' }}
                        title={targetAccount.name}
                    >
                        {targetAccount.name}
                    </Text>
                </HStack>
            </Flex>

            {/* Right: Amount & Action Buttons */}
            <HStack gap={3} flexShrink={0} justifyContent="flex-end" minW={{ base: '100%', sm: 'auto' }}>
                <Text
                    fontWeight={700}
                    fontSize="md"
                    color="gain"
                    letterSpacing="tight"
                    whiteSpace="nowrap"
                >
                    +{formatMoneyByCurrencyCulture(amount, debt.currency.name)}
                </Text>

                <CardActionButtons
                    size="xs"
                    onEdit={() => onEditClicked(debtPayment)}
                    onDelete={() => onDeleteClicked(debtPayment)}
                />
            </HStack>
        </Flex>
    );
};

export default DebtPayment;