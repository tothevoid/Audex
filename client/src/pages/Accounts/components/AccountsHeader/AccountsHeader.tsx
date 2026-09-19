import React, { useEffect, useState } from "react";
import { Box, Card, Flex, NativeSelect } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { AccountCurrencySummary } from "../../../../models/accounts/accountsSummary";
import { NumericMetricItem } from "../../../../shared/components/MetricItem";
import { getCurrencyColor, getCurrencyIcon } from "../../../../shared/utilities/currencyUtils";
import { useColorMode } from "../../../../shared/context/ColorModeContext";
import SectionHeader from "../../../../shared/components/SectionHeader";
import FilterBlock, { FilterBlockDivider } from "../../../../shared/components/FilterBlock";
import { CurrencyEntity } from "../../../../models/currencies/CurrencyEntity";
import { AccountTypeEntity } from "../../../../models/accounts/AccountTypeEntity";
import { getCurrencies } from "../../../../api/currencies/currencyApi";
import { getAccountTypes } from "../../../../api/accounts/accountTypeApi";

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
    const [currencies, setCurrencies] = useState<CurrencyEntity[]>([]);
    const [accountTypes, setAccountTypes] = useState<AccountTypeEntity[]>([]);

    useEffect(() => {
        const loadFilterData = async () => {
            try {
                const [currenciesData, accountTypesData] = await Promise.all([
                    getCurrencies(),
                    getAccountTypes(),
                ]);
                setCurrencies(currenciesData);
                setAccountTypes(accountTypesData);
            } catch (error) {
                console.error("Failed to load filter data for accounts", error);
            }
        };
        loadFilterData();
    }, []);

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
                        <Flex
                            pt={3}
                            mt={1}
                            borderTopWidth="1px"
                            borderColor="border_primary"
                            justifyContent="flex-start"
                            alignItems="center"
                            flexWrap="wrap"
                            gap={{ base: 4, md: 8 }}
                        >
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
                        </Flex>
                    )}
                </Card.Body>
            </Card.Root>

            <FilterBlock
                active={onlyActive}
                activeTitle={t("accounts_list_only_active")}
                onActiveChange={onOnlyActiveChange}
            >
                <FilterBlockDivider />

                <Box minW="140px">
                    <NativeSelect.Root size="sm">
                        <NativeSelect.Field
                            value={selectedCurrencyId || ""}
                            onChange={(e) => onCurrencyChange(e.target.value || null)}
                            backgroundColor="background_primary"
                            borderColor="border_primary"
                            color="text_primary"
                        >
                            <option value="">{t("accounts_filter_all_currencies")}</option>
                            {currencies.map((currency) => (
                                <option key={currency.id} value={currency.id}>
                                    {currency.name}
                                </option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </Box>

                <Box minW="140px">
                    <NativeSelect.Root size="sm">
                        <NativeSelect.Field
                            value={selectedAccountTypeId || ""}
                            onChange={(e) => onAccountTypeChange(e.target.value || null)}
                            backgroundColor="background_primary"
                            borderColor="border_primary"
                            color="text_primary"
                        >
                            <option value="">{t("accounts_filter_all_types")}</option>
                            {accountTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </Box>
            </FilterBlock>
        </Box>
    );
};

export default AccountsHeader;
