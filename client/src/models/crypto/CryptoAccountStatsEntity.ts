import { DistributionModel } from "@/models/dashboard/DashboardEntity";

export interface CryptoAccountStatsEntity {
    cryptoDistribution: DistributionModel[];
    accountsDistribution: DistributionModel[];
}
