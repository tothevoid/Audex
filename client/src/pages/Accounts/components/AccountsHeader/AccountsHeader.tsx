import React from "react";
import { Box, Card } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { AccountCurrencySummary } from "@/models/accounts/accountsSummary";
import { MetricsGrid, NumericMetricItem } from "@/shared/components/MetricItem";
import { getCurrencyColor, getCurrencyIcon } from "@/shared/utilities/currencyUtils";
import { useColorMode } from "@/shared/context/useColorMode";
import SectionHeader from "@/shared/components/SectionHeader";
import FilterBlock, { FilterBlockDivider } from "@/shared/components/FilterBlock";
import BaseSelect from "@/shared/components/BaseSelect/BaseSelect";
import { useCurrencies } from "@/shared/hooks/queries/useCurrencies";
import { useAccountTypes } from "@/shared/hooks/queries/useAccountTypes";

interface Props {
    accountCurrencySummaries: AccountCurrencySummary[];
    onAddClicked: () => void;
    onlyActive: boolean;
    onOnlyActiveChange: (active: boolean) => void;
    selectedCurrencyId?: string | null;
    onCurrencyChange: (currencyId: string | null) => void;
    selectedAccountTypeId?: string | null;
    onAccountTypeChange: (accountTypeId: string | null) => void;
}

export const AccountsHeader: React.FC<Props> = ({
    accountCurrencySummaries,
    onAddClicked,
    onlyActive,
    onOnlyActiveChange,
    selectedCurrencyId,
    onCurrencyChange,
    selectedAccountTypeId,
    onAccountTypeChange,
}) => {
    const { t, i18n } = useTranslation();
    const { resolvedColorMode } = useColorMode();
    const { data: currencies = [] } = useCurrencies();
    const { data: accountTypes = [] } = useAccountTypes();

    return (
        <Box mb={3}>
            <Card.Root
                backgroundColor="background_primary"
                borderColor="border_primary"
                borderRadius="xl"
                mb={3}
                boxShadow="sm"
            >
                <Card.Body padding={4}>
                    <SectionHeader
                        title={t("header_accounts")}
                        size="xl"
                        onAdd={onAddClicked}
                        addButtonTitle={t("accounts_page_summary_add")}
                        mb={accountCurrencySummaries.length > 0 ? 3 : 0}
                    />

                    {accountCurrencySummaries.length > 0 && (
                        <MetricsGrid layout="flex" mt={1}>
                            {accountCurrencySummaries.map((currencySummary) => {
                                const { iconBg, iconColor } = getCurrencyColor(currencySummary.name, resolvedColorMode);
                                const icon = getCurrencyIcon(currencySummary.name, i18n.language, "15px");

                                return (
                                    <NumericMetricItem
                                        key={currencySummary.name}
                                        icon={icon}
                                        iconBg={iconBg}
                                        iconColor={iconColor}
                                        label={currencySummary.name}
                                        value={currencySummary.summary}
                                        currency={currencySummary.name}
                                        size="sm"
                                    />
                                );
                            })}
                        </MetricsGrid>
                    )}
                </Card.Body>
            </Card.Root>

            <FilterBlock
                active={onlyActive}
                activeTitle={t("accounts_list_only_active")}
                onActiveChange={onOnlyActiveChange}
            >
                <FilterBlockDivider />

                <Box w={{ base: "100%", sm: "auto" }} minW={{ base: 0, sm: "155px" }}>
                    <BaseSelect
                        size="sm"
                        placeholder={t("accounts_filter_all_currencies")}
                        collection={currencies}
                        selectedValue={selectedCurrencyId}
                        labelSelector={(currency) => currency.name}
                        valueSelector={(currency) => currency.id}
                        isClearable={true}
                        isSearchable={false}
                        onSelected={(currency) => onCurrencyChange(currency?.id ?? null)}
                    />
                </Box>

                <Box w={{ base: "100%", sm: "auto" }} minW={{ base: 0, sm: "155px" }}>
                    <BaseSelect
                        size="sm"
                        placeholder={t("accounts_filter_all_types")}
                        collection={accountTypes}
                        selectedValue={selectedAccountTypeId}
                        labelSelector={(accountType) => accountType.name}
                        valueSelector={(accountType) => accountType.id}
                        isClearable={true}
                        isSearchable={false}
                        onSelected={(accountType) => onAccountTypeChange(accountType?.id ?? null)}
                    />
                </Box>
            </FilterBlock>
        </Box>
    );
};

export default AccountsHeader;
