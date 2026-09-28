import { DebtPaymentEntity, DebtPaymentEntityRequest, DebtPaymentEntityResponse } from "@/models/debts/DebtPaymentEntity";
import { BasePageable } from "@/shared/models/BasePageable";
import { PagedResult } from "@/shared/models/PagedResult";
import { createEntity, deleteEntity, getPagedEntities, updateEntity } from "@/api/basicApi";
import { prepareDebtPayment, prepareDebtPaymentRequest } from "./debtPaymentApiMapping";

const basicUrl = `DebtPayment`;

export interface DebtPaymentsQuery extends BasePageable {
    debtId?: string;
    tagId?: string;
}

export const getPagedDebtPayments = async (query: DebtPaymentsQuery): Promise<PagedResult<DebtPaymentEntity>> => {
    const pagedResult = await getPagedEntities<DebtPaymentsQuery, DebtPaymentEntityResponse>(`${basicUrl}/GetAll`, query);
    return {
        ...pagedResult,
        items: pagedResult.items.map(prepareDebtPayment)
    };
};

export const createDebtPayment = async (newDebtPayment: DebtPaymentEntity): Promise<boolean | void> => {
    const addedEntity = await createEntity<DebtPaymentEntityRequest, DebtPaymentEntityResponse>(basicUrl, prepareDebtPaymentRequest(newDebtPayment));
    return !!addedEntity;
};

export const updateDebtPayment = async (updatedDebtPayment: DebtPaymentEntity): Promise<boolean> => {
    return await updateEntity(basicUrl, prepareDebtPaymentRequest(updatedDebtPayment));
};

export const deleteDebtPayment = async (debtPaymentId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, debtPaymentId);
};