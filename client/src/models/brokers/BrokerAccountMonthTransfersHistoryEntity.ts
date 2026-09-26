import { BrokerAccountDayTransferEntity } from "./BrokerAccountDayTransferEntity";
import { BrokerAccountTransferAccountValueEntity } from "./BrokerAccountTransferAccountValueEntity";

export interface BrokerAccountMonthTransfersHistoryEntity {
    totalDeposited: number;
    totalWithdrawn: number;
    accounts: BrokerAccountTransferAccountValueEntity[];
    days: BrokerAccountDayTransferEntity[];
}
