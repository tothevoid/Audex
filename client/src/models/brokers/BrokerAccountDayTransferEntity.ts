import { BrokerAccountTransferAccountValueEntity } from "./BrokerAccountTransferAccountValueEntity";

export interface BrokerAccountDayTransferEntity {
    dayIndex: number;
    totalDeposited: number;
    totalWithdrawn: number;
    accountValues: BrokerAccountTransferAccountValueEntity[];
}