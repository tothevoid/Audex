import { Nullable } from "../../shared/utilities/nullable";

export interface SecurityTransactionsFilterValues {
    brokerAccountId?: Nullable<string>;
    securityId?: Nullable<string>;
    startDate?: Nullable<string>;
    endDate?: Nullable<string>;
}

export interface SecurityTransactionsRequest extends SecurityTransactionsFilterValues {
    recordsQuantity: number;
    pageIndex: number;
}

export const createDefaultSecurityTransactionsFilter = (
    brokerAccountId?: Nullable<string>
): SecurityTransactionsFilterValues => ({
    brokerAccountId: brokerAccountId ?? null,
    securityId: null,
    startDate: null,
    endDate: null
});

export const createDefaultSecurityTransactionsRequest = (
    brokerAccountId?: Nullable<string>,
    recordsQuantity: number = 10,
    pageIndex: number = 1
): SecurityTransactionsRequest => ({
    ...createDefaultSecurityTransactionsFilter(brokerAccountId),
    recordsQuantity,
    pageIndex
});