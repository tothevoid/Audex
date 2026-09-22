export interface BrokerAccountPortfolioEntity {    
    currentAmount: number
    dividendsIncome: number
    taxDeductions: number
    profitAndLoss: number
    mainCurrencyAmount: number
    brokerCommissions?: number
    stockExchangeCommissions?: number
    transactionTaxes?: number
}