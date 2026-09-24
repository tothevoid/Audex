import httpClient from "../httpClient";
import { Nullable } from "../../shared/utilities/nullable";
import { logPromiseError } from "../../shared/utilities/webApiUtilities";
import { OperationResult } from "../../shared/models/OperationResult";
import {
    ApplyStatementDiffsRequestEntity,
    ApplyStatementDiffsSummaryEntity,
    BrokerStatementAnalysisResultEntity,
    BrokerStatementImporterEntity
} from "../../models/brokers/BrokerStatementImportModels";

const basicUrl = "/BrokerStatementImport";

export const getStatementImporters = async (): Promise<BrokerStatementImporterEntity[]> => {
    const importers = await httpClient.get(`${basicUrl}/importers`)
        .then((response) => response.data)
        .catch(logPromiseError);

    return importers ?? [];
};

export const analyzeBrokerStatement = async (
    file: File,
    brokerAccountId: string,
    importerId: string,
    timeZoneId: string
): Promise<Nullable<BrokerStatementAnalysisResultEntity>> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("brokerAccountId", brokerAccountId);
    formData.append("importerId", importerId);
    formData.append("timeZoneId", timeZoneId);

    const result = await httpClient.post(`${basicUrl}/analyze`, formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })
        .then((response) => response.data)
        .catch(logPromiseError);

    return result ?? null;
};

export const applyStatementDiffs = async (
    request: ApplyStatementDiffsRequestEntity
): Promise<Nullable<OperationResult<ApplyStatementDiffsSummaryEntity>>> => {
    try {
        const response = await httpClient.post(`${basicUrl}/apply`, request);
        return response.data ?? null;
    } catch (error: any) {
        logPromiseError(error);
        const serverError =
            error?.response?.data?.detail ||
            error?.response?.data?.message ||
            error?.response?.data?.errorMessage ||
            error?.message;
        const serverErrorCode = error?.response?.data?.errorCode;
        return {
            isSuccess: false,
            errorMessage: serverError || undefined,
            errorCode: serverErrorCode || undefined,
            data: undefined
        };
    }
};
