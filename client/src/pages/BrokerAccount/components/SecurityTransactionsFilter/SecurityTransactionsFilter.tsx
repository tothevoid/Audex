import React, { useEffect, useState, useMemo } from "react";
import { Box, Flex, Grid, Text, Badge, Button, HStack, Icon } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { MdFilterList, MdClose } from "react-icons/md";
import DatePicker from "react-datepicker";
import BaseSelect from "../../../../shared/components/BaseSelect/BaseSelect";
import DateInput from "../../../../shared/components/DateInput/DateInput";
import { convertToDateOnly, parseIsoDateOnly } from "../../../../shared/utilities/dateUtils";
import { getSecurities } from "../../../../api/securities/securityApi";
import { getBrokerAccounts } from "../../../../api/brokers/brokerAccountApi";
import { SecurityEntity } from "../../../../models/securities/SecurityEntity";
import { BrokerAccountEntity } from "../../../../models/brokers/BrokerAccountEntity";
import { SecurityTransactionsFilterValues } from "../../../../models/securities/SecurityTransactionsRequest";

export type { SecurityTransactionsFilterValues };

interface Props {
    isGlobalBrokerAccount: boolean;
    filters: SecurityTransactionsFilterValues;
    onFilterChange: (newFilters: SecurityTransactionsFilterValues) => void;
    onReset: () => void;
}

const SecurityTransactionsFilter: React.FC<Props> = ({
    isGlobalBrokerAccount,
    filters,
    onFilterChange,
    onReset
}) => {
    const { t } = useTranslation();
    const [securities, setSecurities] = useState<SecurityEntity[]>([]);
    const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccountEntity[]>([]);

    useEffect(() => {
        let isMounted = true;
        const loadFilterData = async () => {
            const loadedSecurities = await getSecurities();
            if (isMounted) {
                setSecurities(loadedSecurities);
            }
            if (isGlobalBrokerAccount) {
                const loadedAccounts = await getBrokerAccounts();
                if (isMounted) {
                    setBrokerAccounts(loadedAccounts);
                }
            }
        };
        loadFilterData();
        return () => {
            isMounted = false;
        };
    }, [isGlobalBrokerAccount]);

    const selectedSecurity = useMemo(() => {
        if (!filters.securityId) return null;
        return securities.find(security => security.id === filters.securityId) ?? null;
    }, [securities, filters.securityId]);

    const selectedBrokerAccount = useMemo(() => {
        if (!filters.brokerAccountId) return null;
        return brokerAccounts.find(account => account.id === filters.brokerAccountId) ?? null;
    }, [brokerAccounts, filters.brokerAccountId]);

    const selectedStartDate = useMemo(() => {
        return parseIsoDateOnly(filters.startDate);
    }, [filters.startDate]);

    const selectedEndDate = useMemo(() => {
        return parseIsoDateOnly(filters.endDate);
    }, [filters.endDate]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.securityId) count++;
        if (isGlobalBrokerAccount && filters.brokerAccountId) count++;
        if (filters.startDate) count++;
        if (filters.endDate) count++;
        return count;
    }, [filters.securityId, filters.brokerAccountId, filters.startDate, filters.endDate, isGlobalBrokerAccount]);

    const handleSecurityChange = (security: SecurityEntity | null) => {
        onFilterChange({
            ...filters,
            securityId: security ? security.id : null
        });
    };

    const handleBrokerAccountChange = (account: BrokerAccountEntity | null) => {
        onFilterChange({
            ...filters,
            brokerAccountId: account ? account.id : null
        });
    };

    const handleStartDateChange = (date: Date | null) => {
        onFilterChange({
            ...filters,
            startDate: date ? convertToDateOnly(date) : null
        });
    };

    const handleEndDateChange = (date: Date | null) => {
        onFilterChange({
            ...filters,
            endDate: date ? convertToDateOnly(date) : null
        });
    };

    return (
        <Box
            backgroundColor="background_primary"
            borderColor="border_primary"
            borderWidth="1px"
            borderRadius="xl"
            p={4}
            mb={4}
            boxShadow="sm"
        >
            <Flex justifyContent="flex-start" alignItems="center" mb={3} gap={3}>
                <HStack gap={2}>
                    <Icon color="text_secondary" as={MdFilterList} />
                    <Text fontWeight="semibold" fontSize="sm" color="text_primary">
                        {t("security_transactions_filter_title")}
                    </Text>
                </HStack>
                {activeFiltersCount > 0 && (
                    <Button
                        size="xs"
                        colorPalette="green"
                        variant="subtle"
                        onClick={onReset}
                        borderRadius="md"
                    >
                        <MdClose />
                        {t("security_transactions_filter_reset")}
                        <Badge
                            colorPalette="green"
                            variant="solid"
                            size="xs"
                            borderRadius="full"
                            minW="18px"
                            h="18px"
                            display="inline-flex"
                            alignItems="center"
                            justifyContent="center"
                            px={1}
                        >
                            {activeFiltersCount}
                        </Badge>
                    </Button>
                )}
            </Flex>

            <Grid
                templateColumns={{
                    base: "1fr",
                    md: isGlobalBrokerAccount ? "1fr 1fr" : "1fr auto",
                    lg: isGlobalBrokerAccount ? "1.2fr 1.2fr auto" : "1.5fr auto"
                }}
                gap={3}
                alignItems="flex-start"
            >
                <Box>
                    <Text fontSize="xs" fontWeight="medium" color="text_secondary" mb={1}>
                        {t("security_transactions_filter_security")}
                    </Text>
                    <BaseSelect<SecurityEntity, true>
                        collection={securities}
                        selectedValue={selectedSecurity}
                        onSelected={handleSecurityChange}
                        labelSelector={security => security.ticker ? `${security.name} (${security.ticker})` : security.name}
                        valueSelector={security => security.id}
                        isClearable={true}
                        placeholder={t("security_transactions_filter_security_all")}
                    />
                </Box>

                {isGlobalBrokerAccount && (
                    <Box>
                        <Text fontSize="xs" fontWeight="medium" color="text_secondary" mb={1}>
                            {t("security_transactions_filter_broker_account")}
                        </Text>
                        <BaseSelect<BrokerAccountEntity, true>
                            collection={brokerAccounts}
                            selectedValue={selectedBrokerAccount}
                            onSelected={handleBrokerAccountChange}
                            labelSelector={account => account.name}
                            valueSelector={account => account.id}
                            isClearable={true}
                            placeholder={t("security_transactions_filter_broker_account_all")}
                        />
                    </Box>
                )}

                <Box css={{ "& .react-datepicker-wrapper": { width: "100%" } }}>
                    <HStack gap={2} alignItems="flex-end">
                        <Box width={{ base: "calc(50% - 12px)", sm: "135px" }}>
                            <Text fontSize="xs" fontWeight="medium" color="text_secondary" mb={1}>
                                {t("security_transactions_filter_date_from")}
                            </Text>
                            <DatePicker
                                autoComplete="off"
                                selected={selectedStartDate}
                                onChange={handleStartDateChange}
                                maxDate={selectedEndDate ?? undefined}
                                dateFormat="dd.MM.yyyy"
                                isClearable={true}
                                customInput={<DateInput width="100%" placeholder={t("security_transactions_filter_date_from")} />}
                            />
                        </Box>
                        <Text color="text_secondary" fontSize="sm" pb={1.5} userSelect="none">
                            —
                        </Text>
                        <Box width={{ base: "calc(50% - 12px)", sm: "135px" }}>
                            <Text fontSize="xs" fontWeight="medium" color="text_secondary" mb={1}>
                                {t("security_transactions_filter_date_to")}
                            </Text>
                            <DatePicker
                                autoComplete="off"
                                selected={selectedEndDate}
                                onChange={handleEndDateChange}
                                minDate={selectedStartDate ?? undefined}
                                dateFormat="dd.MM.yyyy"
                                isClearable={true}
                                customInput={<DateInput width="100%" placeholder={t("security_transactions_filter_date_to")} />}
                            />
                        </Box>
                    </HStack>
                </Box>
            </Grid>
        </Box>
    );
};

export default SecurityTransactionsFilter;
