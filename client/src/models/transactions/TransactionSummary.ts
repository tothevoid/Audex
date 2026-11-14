export interface TransactionSummary {
    totalIncome: number;
    totalExpenses: number;
    totalCashback: number;
    netExpenses: number;
    netBalance: number;
    dailyAverageExpense: number;
    currencyName?: string;
}

