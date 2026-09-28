import { BrokerAccountDailyStatsEntity } from "@/models/brokers/BrokerAccountDailyStatsEntity";
import { BrokerAccountSummaryEntity } from "@/models/brokers/BrokerAccountSummaryEntity";

export const prepareBrokerAccountsSecurityStats = (brokerAccountSecurity: BrokerAccountSummaryEntity): BrokerAccountSummaryEntity => {
    return {
        ...brokerAccountSecurity
    };
}

export const prepareDailyStats = (dailyStatsEntity: BrokerAccountDailyStatsEntity): BrokerAccountDailyStatsEntity => {
    return {
        ...dailyStatsEntity
    };
}