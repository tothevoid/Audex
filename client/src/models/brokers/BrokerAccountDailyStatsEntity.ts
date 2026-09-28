import { SecurityEntity } from "@/models/securities/SecurityEntity";

export interface BrokerAccountDailyStatsEntity {    
    fetchDate: Date
    startPortfolioValue: number
    currentPortfolioValue: number
    brokerAccountDailySecurityStats: BrokerAccountDailySecurityStatsEntity[]
}

export interface BrokerAccountDailySecurityStatsEntity {
    security: SecurityEntity
    startPrice: number
    currentPrice: number
    minPrice: number
    maxPrice: number
    previousDayClosePrice: number
    quantity: number
}