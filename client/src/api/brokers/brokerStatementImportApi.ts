import { getAllEntities, getEntityByConfig, postEntityResult } from "@/api/basicApi";
import { Nullable } from "@/shared/utilities/nullable";
import { OperationResult } from "@/shared/models/OperationResult";
import {
    ApplyStatementDiffsRequestEntity,
    ApplyStatementDiffsSummaryEntity,
    BrokerStatementAnalysisResultEntity,
    BrokerStatementImporterEntity
} from "@/models/brokers/BrokerStatementImportModels";

const basicUrl = "/BrokerStatementImport";

export const getStatementImporters = async (): Promise<BrokerStatementImporterEntity[]> => {
    return await getAllEntities<BrokerStatementImporterEntity>(`${basicUrl}/importers`);
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

    const result = await getEntityByConfig<BrokerStatementAnalysisResultEntity>(`${basicUrl}/analyze`, formData);
    return result ?? null;
};

export const applyStatementDiffs = async (
    request: ApplyStatementDiffsRequestEntity
): Promise<OperationResult<ApplyStatementDiffsSummaryEntity>> => {
    return await postEntityResult<ApplyStatementDiffsRequestEntity, ApplyStatementDiffsSummaryEntity>(
        `${basicUrl}/apply`,
        request
    );
};
