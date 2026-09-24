import React from "react";
import { Badge, Box, Card, Flex, HStack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
    StatementSecurityEntity,
    StatementSecurityStatus
} from "../../../../../models/brokers/BrokerStatementImportModels";

interface Props {
    security: StatementSecurityEntity;
}

export const StatementSecurityItem: React.FC<Props> = ({ security }) => {
    const { t } = useTranslation();

    const renderStatusBadge = () => {
        switch (security.status) {
            case StatementSecurityStatus.ExistingInDatabase:
                return (
                    <Badge variant="outline" borderColor="border_primary" color="text_secondary" size="sm">
                        {t("broker_statement_security_status_existing")}
                    </Badge>
                );
            case StatementSecurityStatus.CanBeCreatedFromMarket:
                return (
                    <Badge variant="outline" borderColor="border_primary" color="text_secondary" size="sm">
                        {t("broker_statement_security_status_market")}
                    </Badge>
                );
            case StatementSecurityStatus.NotFoundInMarket:
            default:
                return (
                    <Badge variant="outline" borderColor="border_primary" color="text_secondary" size="sm">
                        {t("broker_statement_security_status_not_found")}
                    </Badge>
                );
        }
    };

    return (
        <Card.Root
            backgroundColor="background_secondary"
            borderColor="border_primary"
            p={3}
            borderRadius="md"
        >
            <Flex justifyContent="space-between" alignItems="center">
                <Box>
                    <HStack gap={2}>
                        <Text fontWeight={700} fontSize="sm" color="text_primary">
                            {security.ticker}
                        </Text>
                        {security.isin && (
                            <Text fontSize="xs" color="text_secondary">
                                {security.isin}
                            </Text>
                        )}
                    </HStack>
                    <Text fontSize="xs" color="text_secondary">
                        {security.name}
                    </Text>
                </Box>

                {renderStatusBadge()}
            </Flex>
        </Card.Root>
    );
};
