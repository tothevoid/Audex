import React from 'react';
import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { MdTrendingDown, MdTrendingUp } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { BrokerAccountFundTransferEntity } from '../../../../models/brokers/BrokerAccountFundTransfer';
import { formatTime } from '../../../../shared/utilities/formatters/dateFormatter';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { getBankIconUrl } from '../../../../api/banks/bankApi';
import StoredIcon from '../../../../shared/components/StoredIcon';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';
import EntityCard from '../../../../shared/components/EntityCard/EntityCard';

interface Props {
    isGlobalBrokerAccount: boolean;
    fundTransfer: BrokerAccountFundTransferEntity;
    onEditClicked: (fundTransfer: BrokerAccountFundTransferEntity) => void;
    onDeleteClicked: (fundTransfer: BrokerAccountFundTransferEntity) => void;
}

const BrokerAccountFundTransfer: React.FC<Props> = ({
    isGlobalBrokerAccount,
    fundTransfer,
    onEditClicked,
    onDeleteClicked
}) => {
    const { account, amount, date, income, brokerAccount } = fundTransfer;
    const { t, i18n } = useTranslation();

    const currencyName = account?.currency?.name;
    const bankIconUrl = account?.bank?.iconKey ? getBankIconUrl(account.bank.iconKey) : undefined;

    return (
        <EntityCard p={3} my={2}>
            <Flex justifyContent="space-between" alignItems="center" gap={3}>
                {/* Left Section: Time + Icon + Account Info */}
                <Flex alignItems="center" gap={3} flex={1} minW={0}>
                    {/* Left Time Badge */}
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
                        {formatTime(date, i18n)}
                    </Badge>

                    {/* Bank / Transfer Avatar */}
                    <Flex
                        w={10}
                        h={10}
                        minW={10}
                        borderRadius="xl"
                        align="center"
                        justify="center"
                        backgroundColor={income ? 'status_success_bg' : 'status_danger_bg'}
                    >
                        <StoredIcon
                            src={bankIconUrl}
                            fallbackIcon={
                                income ? (
                                    <MdTrendingUp size={20} color="var(--chakra-colors-gain)" />
                                ) : (
                                    <MdTrendingDown size={20} color="var(--chakra-colors-loss)" />
                                )
                            }
                            size="sm"
                        />
                    </Flex>

                    {/* Transfer Details */}
                    <Box flex={1} minW={0}>
                        {/* Main line: Bank Account Name + Broker Account Badge */}
                        <Flex align="center" gap={2} flexWrap="wrap">
                            <Text fontWeight={600} fontSize="sm" color="text_primary" truncate>
                                {account?.name}
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

                        {/* Subtitle: Operation Type */}
                        <Text fontSize="2xs" color="text_secondary" mt={0.5}>
                            {income
                                ? t("broker_account_transfer_modal_operation_deposit")
                                : t("broker_account_transfer_modal_operation_withdraw")}
                        </Text>
                    </Box>
                </Flex>

                {/* Right Section: Amount + Actions */}
                <Flex alignItems="center" gap={3} flexShrink={0}>
                    <Box textAlign="right">
                        <Text
                            fontWeight={700}
                            fontSize="sm"
                            color={income ? "gain" : "loss"}
                            whiteSpace="nowrap"
                        >
                            {income ? "+" : "−"}
                            {formatMoneyByCurrencyCulture(amount, currencyName)}
                        </Text>
                    </Box>

                    <CardActionButtons
                        size="xs"
                        onEdit={() => onEditClicked(fundTransfer)}
                        onDelete={() => onDeleteClicked(fundTransfer)}
                    />
                </Flex>
            </Flex>
        </EntityCard>
    );
};

export default BrokerAccountFundTransfer;