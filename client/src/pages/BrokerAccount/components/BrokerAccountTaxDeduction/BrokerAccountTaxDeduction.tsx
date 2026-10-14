import React from 'react';
import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { BsBank } from 'react-icons/bs';
import { useTranslation } from 'react-i18next';
import { BrokerAccountTaxDeductionEntity } from '@/models/brokers/BrokerAccountTaxDeductionEntity';
import { formatDate } from '@/shared/utilities/formatters/dateFormatter';
import { formatMoneyByCurrencyCulture } from '@/shared/utilities/formatters/moneyFormatter';
import { getBankIconUrl } from '@/api/banks/bankApi';
import StoredIcon from '@/shared/components/StoredIcon';
import CardActionButtons from '@/shared/components/CardActionButtons/CardActionButtons';
import EntityCard from '@/shared/components/EntityCard/EntityCard';

interface Props {
    isGlobalBrokerAccount: boolean;
    taxDeduction: BrokerAccountTaxDeductionEntity;
    onEditClicked: (taxDeduction: BrokerAccountTaxDeductionEntity) => void;
    onDeleteClicked: (taxDeduction: BrokerAccountTaxDeductionEntity) => void;
}

const BrokerAccountTaxDeduction: React.FC<Props> = ({
    isGlobalBrokerAccount,
    taxDeduction,
    onEditClicked,
    onDeleteClicked
}) => {
    const { name, amount, dateApplied, brokerAccount } = taxDeduction;
    const { i18n } = useTranslation();

    const currencyName = brokerAccount?.currency?.name;
    const bankIconUrl = brokerAccount?.bank?.iconKey ? getBankIconUrl(brokerAccount.bank.iconKey) : undefined;

    return (
        <EntityCard p={3} my={2}>
            <Flex justifyContent="space-between" alignItems="center" gap={3}>
                {/* Left Section: Date + Icon + Details */}
                <Flex alignItems="center" gap={3} flex={1} minW={0}>
                    {/* Left Date Badge */}
                    <Badge
                        size="sm"
                        variant="subtle"
                        backgroundColor="background_secondary"
                        color="text_secondary"
                        borderRadius="md"
                        px={2}
                        py={1}
                        fontSize="xs"
                        fontWeight="semibold"
                        letterSpacing="tight"
                        flexShrink={0}
                    >
                        {formatDate(dateApplied, i18n)}
                    </Badge>

                    {/* Account Avatar */}
                    <Flex
                        w={10}
                        h={10}
                        minW={10}
                        borderRadius="xl"
                        align="center"
                        justify="center"
                        backgroundColor="status_success_bg"
                    >
                        <StoredIcon
                            src={bankIconUrl}
                            fallbackIcon={<BsBank size={20} color="var(--chakra-colors-gain)" />}
                            size="sm"
                        />
                    </Flex>

                    {/* Tax Deduction Details */}
                    <Box flex={1} minW={0}>
                        {/* Main line: Tax Deduction Name + Broker Account Badge */}
                        <Flex align="center" gap={2} flexWrap="wrap">
                            <Text fontWeight={600} fontSize="sm" color="text_primary" truncate>
                                {name}
                            </Text>

                            {isGlobalBrokerAccount && brokerAccount?.name && (
                                <Badge
                                    size="xs"
                                    variant="outline"
                                    borderColor="border_primary"
                                    color="text_secondary"
                                    borderRadius="md"
                                >
                                    {brokerAccount.name}
                                </Badge>
                            )}
                        </Flex>
                    </Box>
                </Flex>

                {/* Right Section: Amount + Actions */}
                <Flex alignItems="center" gap={3} flexShrink={0}>
                    <Box textAlign="right">
                        <Text
                            fontWeight={700}
                            fontSize="sm"
                            color="gain"
                            whiteSpace="nowrap"
                        >
                            +{formatMoneyByCurrencyCulture(amount, currencyName)}
                        </Text>
                    </Box>

                    <CardActionButtons
                        size="xs"
                        onEdit={() => onEditClicked(taxDeduction)}
                        onDelete={() => onDeleteClicked(taxDeduction)}
                    />
                </Flex>
            </Flex>
        </EntityCard>
    );
};

export default BrokerAccountTaxDeduction;