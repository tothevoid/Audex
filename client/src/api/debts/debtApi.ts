import { DebtEntity, DebtEntityRequest, DebtEntityResponse } from "@/models/debts/DebtEntity";
import { createEntity, deleteEntity, getAllEntities, updateEntity } from "@/api/basicApi";
import { prepareDebt, prepareDebtRequest } from "./debtApiMapping";

const basicUrl = `Debt`;

export const getDebts = async (onlyActive: boolean): Promise<DebtEntity[]> =>  {
    return await getAllEntities<DebtEntityResponse>(`${basicUrl}/GetAll?onlyActive=${onlyActive}`)
    .then((debtsResponses: DebtEntityResponse[]) => debtsResponses.map(prepareDebt))
}

export const createDebt = async (newDebt: DebtEntity): Promise<DebtEntity | void> => {
    return await createEntity<DebtEntityRequest, DebtEntityResponse>(basicUrl, prepareDebtRequest(newDebt))
        .then((debt) => debt && prepareDebt(debt));
}

export const updateDebt = async (updatedDept: DebtEntity): Promise<boolean> => {
    return await updateEntity(basicUrl, prepareDebtRequest(updatedDept));
}

export const deleteDebt = async (debtId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, debtId);
}