import { Fragment, useEffect, useState } from "react";
import { getBrokerAccountStats } from "../../../../api/brokers/brokerAccountSummaryApi";
import { BrokerAccountSummaryEntity } from "../../../../models/brokers/BrokerAccountSummaryEntity";
import { SimpleGrid } from "@chakra-ui/react";
import { useUserProfile } from "../../../../features/UserProfileSettingsModal/hooks/UserProfileContext";
import MoneyCard from "../../../../shared/components/MoneyCard/MoneyCard";
import BrokerAccountTransfersHistoryChart from "../BrokerAccountTransfersHistoryChart/BrokerAccountTransfersHistoryChart";
import { useTranslation } from "react-i18next";
import { Nullable } from "../../../../shared/utilities/nullable";

interface Props {
    brokerAccountId: Nullable<string>
}

const BrokerAccountStats: React.FC<Props> = ({ brokerAccountId }) => {    
    const { user } = useUserProfile();

    const {t} = useTranslation();

    const [stats, setStats] = useState<BrokerAccountSummaryEntity | null>(null); 

    useEffect(() => {
        const getData = async () => {
            const result = await getBrokerAccountStats(brokerAccountId);
            if (!result) {
                return;
            }

            setStats(result);
        }
    
        getData();
    }, [])

    if (!stats || !user) return <Fragment/>;

    const {brokerAccountStats, transferStats} = stats;

    const currencyName = user.currency.name;
    
    return <SimpleGrid marginBlock={4} gap={4}>
        <SimpleGrid columns={2} gap={4}>
            <MoneyCard title={t("broker_account_stats_invested")} value={brokerAccountStats.investedValue} currency={currencyName}/>
            <MoneyCard title={t("broker_account_stats_current_value")} value={brokerAccountStats.currentValue} currency={currencyName}/>
        </SimpleGrid>
        <SimpleGrid columns={2} gap={4}>
            <MoneyCard title={t("broker_account_stats_deposited")} value={transferStats.totalDeposited} currency={currencyName}/>
            <MoneyCard title={t("broker_account_stats_withdrawn")} value={transferStats.totalWithdrawn} currency={currencyName}/>
        </SimpleGrid>
        <BrokerAccountTransfersHistoryChart brokerAccountId={brokerAccountId} currencyName={currencyName}/>
    </SimpleGrid>
}

export default BrokerAccountStats;