import { Nullable } from "../../shared/utilities/nullable";

export enum StatementDiffType {
    New = 1,
    FieldDiscrepancy = 2,
    Identical = 3,
    MissingInStatement = 4
}

export enum StatementSecurityStatus {
    ExistingInDatabase = 1,
    CanBeCreatedFromMarket = 2,
    NotFoundInMarket = 3
}

export enum StatementDiscrepancyField {
    Price = 1,
    BrokerCommission = 2,
    StockExchangeCommission = 3,
    Tax = 4,
    Date = 5
}

export interface BrokerStatementImporterEntity {
    id: string;
    name: string;
    supportedExtensions: string[];
}

import { TimeZoneEntity } from "../common/TimeZoneEntity";

export type BrokerStatementTimeZoneEntity = TimeZoneEntity;

export interface StatementSecurityEntity {
    isin?: Nullable<string>;
    ticker: string;
    name: string;
    status: StatementSecurityStatus;
    resolvedSecurityId?: Nullable<string>;
}

import { SecurityTransactionEntityResponse } from "../securities/SecurityTransactionEntity";

export interface BrokerStatementDiffItemEntity {
    id: string;
    diffType: StatementDiffType;
    securityResolutionStatus: StatementSecurityStatus;
    hasWarning: boolean;
    warningMessage?: Nullable<string>;
    selectedForApply: boolean;
    securityName: string;
    ticker: string;
    isin?: Nullable<string>;
    tradeDateTime: string;
    isConsolidated?: boolean;
    consolidatedCount?: number;
    discrepancyFields: StatementDiscrepancyField[];
    statementTransaction?: Nullable<SecurityTransactionEntityResponse>;
    databaseTransaction?: Nullable<SecurityTransactionEntityResponse>;
}

export interface BrokerStatementAnalysisResultEntity {
    sessionId: string;
    brokerAccountId: string;
    brokerAccountName: string;
    importerId: string;
    timeZoneId: string;
    periodStart?: Nullable<string>;
    periodEnd?: Nullable<string>;
    diffItems: BrokerStatementDiffItemEntity[];
    securities: StatementSecurityEntity[];
    newCount: number;
    discrepancyCount: number;
    identicalCount: number;
    missingCount: number;
    warningCount: number;
}

export interface ApplyStatementDiffsRequestEntity {
    sessionId: string;
    selectedDiffIds: string[];
}

export interface ApplyStatementDiffsSummaryEntity {
    brokerAccountId: string;
    createdTransactionsCount: number;
    updatedTransactionsCount: number;
    createdSecuritiesCount: number;
    totalProcessedCount: number;
}
