import { Nullable } from "@/shared/utilities/nullable";
import { BrokerAccountTransferAccountValueEntity } from "@/models/brokers/BrokerAccountTransferAccountValueEntity";

export const YEAR_RANGE = "YEAR_RANGE";
export const MONTH_RANGE = "MONTH_RANGE";

export type TransfersRangeType = typeof YEAR_RANGE | typeof MONTH_RANGE;

export interface RangeType {
    label: string;
    value: TransfersRangeType;
}

export interface NumericOption {
    label: string;
    value: number;
}

export interface AccountItem {
    id: string;
    name: string;
    color: string;
    deposited: number;
    withdrawn: number;
}

export interface AccountSelectOption {
    id: Nullable<string>;
    name: string;
}

export interface TransfersHistoryFilterState {
    rangeType: TransfersRangeType;
    year: number;
    month: number;
    accountId: Nullable<string>;
}

export interface TransfersChartRow {
    name: string;
    totalIncome: number;
    totalWithdraw: number;
    accountValues: BrokerAccountTransferAccountValueEntity[];
    [accountId: string]: string | number | BrokerAccountTransferAccountValueEntity[] | undefined;
}
