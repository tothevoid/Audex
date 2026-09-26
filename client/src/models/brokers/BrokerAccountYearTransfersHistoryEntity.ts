import { BrokerAccountMonthTransferEntity } from "./BrokerAccountMonthTransferEntity";
import { BrokerAccountTransferAccountValueEntity } from "./BrokerAccountTransferAccountValueEntity";

export interface BrokerAccountYearTransfersHistoryEntity {
    totalDeposited: number;
    totalWithdrawn: number;
    accounts: BrokerAccountTransferAccountValueEntity[];
    months: BrokerAccountMonthTransferEntity[];
}
