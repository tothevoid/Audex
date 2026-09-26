import { Fragment, useEffect, useState } from "react";
import { getBrokerAccountStats } from "../../../../api/brokers/brokerAccountSummaryApi";
import { getBrokerAccounts } from "../../../../api/brokers/brokerAccountApi";
import { BrokerAccountSummaryEntity } from "../../../../models/brokers/BrokerAccountSummaryEntity";
import { BrokerAccountEntity } from "../../../../models/brokers/BrokerAccountEntity";
import { Card, SimpleGrid } from "@chakra-ui/react";
import { useUserProfile } from "../../../../features/UserProfileSettingsModal/hooks/UserProfileContext";
import { NumericMetricItem } from "../../../../shared/components/MetricItem";
import BrokerAccountTransfersHistoryChart from "../BrokerAccountTransfersHistoryChart/BrokerAccountTransfersHistoryChart";
import { useTranslation } from "react-i18next";
import { Nullable } from "../../../../shared/utilities/nullable";
import { BsBank, BsWallet2, BsArrowDownLeft, BsArrowUpRight } from "react-icons/bs";
import LoadingCard from "../../../../shared/components/LoadingCard/LoadingCard";

interface Props {
    brokerAccountId: Nullable<string>;
}

const BrokerAccountStats: React.FC<Props> = ({ brokerAccountId }) => {    
    const { user } = useUserProfile();
    const { t } = useTranslation();

    const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccountEntity[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<Nullable<string>>(null);

    const effectiveAccountId = brokerAccountId ?? selectedAccountId;

    const [stats, setStats] = useState<BrokerAccountSummaryEntity | null>(null); 
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!brokerAccountId) {
            getBrokerAccounts().then((accounts) => {
                if (accounts) {
                    setBrokerAccounts(accounts);
                }
            });
        }
    }, [brokerAccountId]);

    useEffect(() => {
        let isMounted = true;
        const getData = async () => {
            setIsLoading(true);
            try {
                const result = await getBrokerAccountStats(effectiveAccountId);
                if (isMounted && result) {
                    setStats(result);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
    
        getData();

        return () => {
            isMounted = false;
        };
    }, [effectiveAccountId]);

    if (!user) return <Fragment />;

    const currencyName = user.currency.name;
    
    return (
        <SimpleGrid marginBlock={4} gap={4}>
            {isLoading ? (
                <LoadingCard minH="80px" p={4} />
            ) : stats ? (
                <Card.Root
                    backgroundColor="background_primary"
                    borderColor="border_primary"
                    borderRadius="xl"
                    boxShadow="sm"
                    p={4}
                >
                    <SimpleGrid columns={{ base: 2, sm: 2, md: 4 }} gap={{ base: 4, md: 6 }}>
                        <NumericMetricItem
                            icon={<BsWallet2 size={16} />}
                            iconBg="status_info_bg"
                            iconColor="status_info"
                            label={t("broker_account_stats_invested")}
                            value={stats.brokerAccountStats.investedValue}
                            currency={currencyName}
                            size="sm"
                        />
                        <NumericMetricItem
                            icon={<BsBank size={16} />}
                            iconBg="status_warning_bg"
                            iconColor="status_warning"
                            label={t("broker_account_stats_current_value")}
                            value={stats.brokerAccountStats.currentValue}
                            currency={currencyName}
                            size="sm"
                        />
                        <NumericMetricItem
                            icon={<BsArrowDownLeft size={16} />}
                            iconBg="status_success_bg"
                            iconColor="status_success"
                            label={t("broker_account_stats_deposited")}
                            value={stats.transferStats.totalDeposited}
                            currency={currencyName}
                            size="sm"
                        />
                        <NumericMetricItem
                            icon={<BsArrowUpRight size={16} />}
                            iconBg="status_danger_bg"
                            iconColor="status_danger"
                            label={t("broker_account_stats_withdrawn")}
                            value={stats.transferStats.totalWithdrawn}
                            currency={currencyName}
                            size="sm"
                        />
                    </SimpleGrid>
                </Card.Root>
            ) : null}
            <BrokerAccountTransfersHistoryChart
                brokerAccountId={brokerAccountId}
                selectedAccountId={selectedAccountId}
                onAccountChange={setSelectedAccountId}
                brokerAccounts={brokerAccounts}
                currencyName={currencyName}
            />
        </SimpleGrid>
    );
};

export default BrokerAccountStats;