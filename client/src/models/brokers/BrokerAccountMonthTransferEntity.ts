import { BrokerAccountTransferAccountValueEntity } from "./BrokerAccountTransferAccountValueEntity";

export interface BrokerAccountMonthTransferEntity {
    monthIndex: number;
    totalDeposited: number;
    totalWithdrawn: number;
    accountValues: BrokerAccountTransferAccountValueEntity[];
}