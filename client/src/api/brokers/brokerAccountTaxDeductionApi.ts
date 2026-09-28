import { BrokerAccountTaxDeductionEntity, BrokerAccountTaxDeductionEntityResponse, TaxDeductionsQuery } from "@/models/brokers/BrokerAccountTaxDeductionEntity";
import { createEntity, deleteEntity, getAllEntitiesByConfig, getEntity, updateEntity } from "@/api/basicApi";
import { prepareBrokerAccountTaxDeductionRequest, prepareBrokerAccountTaxDeductionResponse } from "./brokerAccountTaxDeductionApiMapping";

const basicUrl = `BrokerAccountTaxDeduction`;

export const getBrokerAccountTaxDeductions = async (query: TaxDeductionsQuery): Promise<BrokerAccountTaxDeductionEntity[]> => {
    return await getAllEntitiesByConfig<TaxDeductionsQuery, BrokerAccountTaxDeductionEntityResponse>(`${basicUrl}/GetAll`, query)
        .then((data) => data.map(prepareBrokerAccountTaxDeductionResponse));
};

export const createBrokerAccountTaxDeduction = async (addedTaxDeduction: BrokerAccountTaxDeductionEntity): Promise<void> => {
    await createEntity(basicUrl, prepareBrokerAccountTaxDeductionRequest(addedTaxDeduction));
};

export const getAmountByBrokerAccount = async (brokerAccountId: string): Promise<number> => {
    return await getEntity<number>(`${basicUrl}/GetAmountByBrokerAccount?brokerAccountId=${brokerAccountId}`) ?? 0;   
};

export const updateBrokerAccountTaxDeduction = async (updatedTaxDeduction: BrokerAccountTaxDeductionEntity): Promise<void> => {
    await updateEntity(basicUrl, prepareBrokerAccountTaxDeductionRequest(updatedTaxDeduction));
};

export const deleteBrokerAccountTaxDeduction = async (taxDeductionId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, taxDeductionId);
};