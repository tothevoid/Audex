import React from "react";
import { Card, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { CryptoAccountEntity } from "../../../../models/crypto/CryptoAccountEntity";
import { BsWallet2 } from "react-icons/bs";
import { SiBinance } from "react-icons/si";
import { NumericMetricItem } from "../../../../shared/components/MetricItem";
import { getCryptoProviderIconUrl } from "../../../../api/crypto/cryptoProviderApi";
import StoredIcon from "../../../../shared/components/StoredIcon/StoredIcon";

import AddButton from "../../../../shared/components/AddButton/AddButton";
import { useUserProfile } from "../../../../features/UserProfileSettingsModal/hooks/UserProfileContext";
import { getCurrencies } from "../../../../api/currencies/currencyApi";

interface CryptoAccountHeaderProps {
    cryptoAccount?: CryptoAccountEntity | null;
    title?: string;
    totalBalanceUsd: number;
    onAddClicked?: () => void;
}

export const CryptoAccountHeader: React.FC<CryptoAccountHeaderProps> = ({
    cryptoAccount,
    title,
    totalBalanceUsd,
    onAddClicked,
}) => {
    const { t } = useTranslation();
    const { user } = useUserProfile();
    const [usdRate, setUsdRate] = React.useState<number | null>(null);

    React.useEffect(() => {
        const fetchCurrencies = async () => {
            const currencies = await getCurrencies();
            const usdCurrency = currencies.find(c => c.name.toUpperCase() === "USD");
            if (usdCurrency && usdCurrency.rate > 0) {
                setUsdRate(usdCurrency.rate);
            }
        };
        fetchCurrencies();
    }, []);

    const mainCurrency = user?.currency?.name;
    const isConvertedVisible = !!mainCurrency && mainCurrency.toUpperCase() !== "USD" && usdRate !== null;
    const totalConverted = isConvertedVisible ? totalBalanceUsd * (usdRate ?? 1) : null;

    const headerTitle = title ?? cryptoAccount?.name ?? t("all_crypto_accounts_header");
    const providerName = cryptoAccount?.cryptoProvider?.name;

    return (
        <Card.Root
            backgroundColor="background_primary"
            borderColor="border_primary"
            borderRadius="xl"
            mb={4}
            boxShadow="sm"
        >
            <Card.Body padding={4}>
                {/* Header Top Bar */}
                <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={3} mb={3}>
                    <HStack gap={3} alignItems="center">
                        <Stack gap={0}>
                            <HStack gap={2} alignItems="center">
                                {cryptoAccount?.cryptoProvider && (
                                    <StoredIcon
                                        src={cryptoAccount.cryptoProvider.iconKey ? getCryptoProviderIconUrl(cryptoAccount.cryptoProvider.iconKey) : undefined}
                                        fallbackIcon={<SiBinance size={16} color="var(--chakra-colors-text_secondary)" />}
                                        size="sm"
                                        title={providerName}
                                    />
                                )}
                                <Text fontSize="xl" fontWeight={800} color="text_primary">
                                    {headerTitle}
                                </Text>
                            </HStack>
                        </Stack>
                    </HStack>

                    {onAddClicked && (
                        <AddButton
                            buttonTitle={t("add_crypto_account_cryptocurrency_title")}
                            onClick={onAddClicked}
                        />
                    )}
                </Flex>

                {/* Metrics list */}
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
                    <NumericMetricItem
                        icon={<BsWallet2 size={16} />}
                        iconBg="rgba(234, 179, 8, 0.15)"
                        iconColor="yellow.400"
                        label={t("crypto_account_header_balance")}
                        value={totalBalanceUsd}
                        currency="USD"
                        size="sm"
                    />

                    {isConvertedVisible && totalConverted !== null && (
                        <NumericMetricItem
                            icon={<BsWallet2 size={16} />}
                            iconBg="rgba(59, 130, 246, 0.15)"
                            iconColor="blue.400"
                            label={`${t("crypto_account_header_balance")} (${mainCurrency})`}
                            value={totalConverted}
                            currency={mainCurrency}
                            size="sm"
                        />
                    )}
                </Flex>
            </Card.Body>
        </Card.Root>
    );
};

export default CryptoAccountHeader;
