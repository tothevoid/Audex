import React, { useEffect, useState } from "react";
import { Card, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { getTransactionsBySecurity } from "@/api/securities/securityTransactionApi";
import { SecurityTransactionsHistory } from "@/models/securities/SecurityTransactionsHistory";
import { SecurityTransactionsPriceChart } from "./SecurityTransactionsPriceChart";
import { SecurityTransactionsVolumeChart } from "./SecurityTransactionsVolumeChart";

interface Props {
    securityId: string;
    currencyName: string;
    currentPrice: number;
}

interface State {
    transactions: SecurityTransactionsHistory[];
}

const SecurityTransactionsChart: React.FC<Props> = ({
    securityId,
    currencyName,
    currentPrice,
}) => {
    const [state, setState] = useState<State>({ transactions: [] });
    const { t } = useTranslation();

    useEffect(() => {
        const initData = async () => {
            const historyValues = await getTransactionsBySecurity(securityId);
            if (!historyValues) {
                return;
            }

            setState((currentState) => {
                return { ...currentState, transactions: historyValues };
            });
        };

        initData();
    }, [securityId]);

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

            <SecurityTransactionsPriceChart
                data={state.transactions}
                currencyName={currencyName}
                currentPrice={currentPrice}
            />

            <SecurityTransactionsVolumeChart data={state.transactions} />
        </Card.Root>
    );
};

export default SecurityTransactionsChart;
