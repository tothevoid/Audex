export interface BrokerAccountTransfersAvailableDatesEntity {
    availableYears: number[];
    availableMonthsByYear: Record<number, number[]>;
}
