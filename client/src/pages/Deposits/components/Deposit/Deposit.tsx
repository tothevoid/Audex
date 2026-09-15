import React from 'react';
import { Card, Container, Flex, Progress, Stack, Text } from "@chakra-ui/react";
import { formatNumericDate } from "../../../../shared/utilities/formatters/dateFormatter";
import { formatMoney } from "../../../../shared/utilities/formatters/moneyFormatter";
import { DepositEntity } from "../../../../models/deposits/DepositEntity";
import { useTranslation } from "react-i18next";
import { getBankIconUrl } from "../../../../api/banks/bankApi";
import { BsBank } from "react-icons/bs";
import StoredIcon from "../../../../shared/components/StoredIcon";
import CardActionButtons from "../../../../shared/components/CardActionButtons/CardActionButtons";
import EntityCard from "../../../../shared/components/EntityCard/EntityCard";

interface Props {
    deposit: DepositEntity;
    onEditClicked: (deposit: DepositEntity) => void;
    onCloneClicked: (deposit: DepositEntity) => void;
    onDeleteClicked: (deposit: DepositEntity) => void;
}

const Deposit: React.FC<Props> = ({ deposit, onEditClicked, onCloneClicked, onDeleteClicked }) => {
    const { i18n, t } = useTranslation();

    const estimatedEarnTitle = deposit.to > new Date() ?
        t("entity_deposit_estimated_earn") :
        t("entity_deposit_earned");

    const daysPassed = Math.floor((new Date().getTime() - new Date(deposit.from).getTime()) / (1000 * 3600 * 24));
    const totalDays = Math.floor((new Date(deposit.to).getTime() - new Date(deposit.from).getTime()) / (1000 * 3600 * 24));
    const progressValue = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

    const alreadyEarned = totalDays > 0 ? ((deposit.estimatedEarn ?? 0) / totalDays) * daysPassed : 0;

    const bankIconUrl = deposit?.bank?.iconKey ? getBankIconUrl(deposit.bank.iconKey) : undefined;

    return (
        <EntityCard>
            <Card.Body p={4} color="text_primary">
                <Stack gap={3}>
                    <Flex gapX={2} alignItems="center" justifyContent="flex-start">
                        <StoredIcon
                            src={bankIconUrl}
                            fallbackIcon={<BsBank size={16} color="#aaa" />}
                            size="sm"
                        />
                        <Text fontSize="xl" fontWeight={600}>
                            {deposit.name}
                        </Text>
                    </Flex>

                    <Progress.Root colorPalette="green" value={progressValue}>
                        <Progress.Track>
                            <Progress.Range />
                        </Progress.Track>
                    </Progress.Root>

                    <Container padding={0}>
                        <Flex justifyContent="space-between">
                            <Text color="gray.500">{t("entity_deposit_initial_amount")}:</Text>
                            <Text>{formatMoney(deposit.initialAmount)}</Text>
                        </Flex>
                        <Flex justifyContent="space-between">
                            <Text color="gray.500">{t("entity_deposit_percentage")}:</Text>
                            <Text>{deposit.percentage}%</Text>
                        </Flex>
                        <Flex justifyContent="space-between">
                            <Text color="gray.500">{t("entity_deposit_dates")}:</Text>
                            <Text color="green.500">{`${formatNumericDate(deposit.from, i18n)} - ${formatNumericDate(deposit.to, i18n)}`}</Text>
                        </Flex>
                        <Flex justifyContent="space-between">
                            <Text color="gray.500">{estimatedEarnTitle}:</Text>
                            <Text color="green.500">+{formatMoney(deposit?.estimatedEarn ?? 0)}</Text>
                        </Flex>
                        {deposit.to > new Date() && (
                            <Flex justifyContent="space-between">
                                <Text color="gray.500">{t("entity_deposit_already_earned")}:</Text>
                                <Text color="green.500">+{formatMoney(alreadyEarned)}</Text>
                            </Flex>
                        )}

                        <Flex paddingTop={4} justifyContent="end">
                            <CardActionButtons
                                size="sm"
                                onEdit={() => onEditClicked(deposit)}
                                onCopy={() => onCloneClicked(deposit)}
                                onDelete={() => onDeleteClicked(deposit)}
                            />
                        </Flex>
                    </Container>
                </Stack>
            </Card.Body>
        </EntityCard>
    );
};

export default Deposit;