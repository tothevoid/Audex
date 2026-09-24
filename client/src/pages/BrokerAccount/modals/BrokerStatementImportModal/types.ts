export type StatementFilterType =
    | "all"
    | "new"
    | "discrepancies"
    | "identical"
    | "missing"
    | "warnings";

export interface StatementConfig {
    file: File;
    accountId: string;
    importerId: string;
    timeZoneId: string;
}
