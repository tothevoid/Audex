import React, { useEffect, useState } from "react";
import { Card, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { getTransactionsBySecurity } from "@/api/securities/securityTransactionApi";
import { SecurityTransactionsHistory } from "@/models/securities/SecurityTransactionsHistory";
import { LoadingChart } from "@/shared/components/LoadingChart";
import { PlaceholderWrapper } from "@/shared/components/Placeholder";
import { SecurityTransactionsPriceChart } from "./SecurityTransactionsPriceChart";
import { SecurityTransactionsVolumeChart } from "./SecurityTransactionsVolumeChart";

interface Props {
    securityId: string;
    currencyName: string;
    currentPrice: number;
}

interface State {
    transactions: SecurityTransactionsHistory[];
    isLoading: boolean;
}

const SecurityTransactionsChart: React.FC<Props> = ({
    securityId,
    currencyName,
    currentPrice,
}) => {
    const [state, setState] = useState<State>({
        transactions: [],
        isLoading: true,
    });
    const { t } = useTranslation();

    useEffect(() => {
        let isMounted = true;

        const initData = async () => {
            setState((currentState) => ({ ...currentState, isLoading: true }));
            try {
                const historyValues = await getTransactionsBySecurity(securityId);
                if (isMounted) {
                    setState({
                        transactions: historyValues ?? [],
                        isLoading: false,
                    });
                }
            } catch {
                if (isMounted) {
                    setState({
                        transactions: [],
                        isLoading: false,
                    });
                }
            }
        };

        initData();

        return () => {
            isMounted = false;
        };
    }, [securityId]);

    const hasData = state.transactions.length > 0;

    return (
        <Card.Root
            backgroundColor="background_primary"
            borderColor="border_primary"
            borderRadius="xl"
            mt={4}
            p={5}
            boxShadow="sm"
        >
            {/* Header: Title */}
            <Text fontSize="md" fontWeight={700} color="text_primary" mb={3}>
                {t("security_page_tabs_transactions")}
            </Text>

            <LoadingChart isLoading={state.isLoading} height="430px" borderRadius="xl">
                <PlaceholderWrapper
                    hasData={hasData}
                    text={t("security_transactions_empty")}
                    placeholderBoxProps={{ mb: 0 }}
                >
                    <SecurityTransactionsPriceChart
                        data={state.transactions}
                        currencyName={currencyName}
                        currentPrice={currentPrice}
                    />

                    <SecurityTransactionsVolumeChart data={state.transactions} />
                </PlaceholderWrapper>
            </LoadingChart>
        </Card.Root>
    );
};

export default SecurityTransactionsChart;
