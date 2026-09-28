import { DebtTagEntity, DebtTagStatsEntity } from "@/models/debts/DebtTagEntity";
import { createEntity, deleteEntity, getAllEntities, updateEntity } from "@/api/basicApi";

const basicUrl = `DebtTag`;

export const getDebtTags = async (): Promise<DebtTagEntity[]> => {
    return await getAllEntities<DebtTagEntity>(basicUrl);
};

export const getDebtTagStats = async (): Promise<DebtTagStatsEntity[]> => {
    return await getAllEntities<DebtTagStatsEntity>(`${basicUrl}/stats`);
};

export const createDebtTag = async (tag: Omit<DebtTagEntity, "id">): Promise<DebtTagEntity | null> => {
    const result = await createEntity<Omit<DebtTagEntity, "id">, string>(basicUrl, tag);
    if (typeof result === "string") {
        return { ...tag, id: result };
    }
    return (result as unknown as DebtTagEntity) || null;
};

export const updateDebtTag = async (tag: DebtTagEntity): Promise<boolean> => {
    return await updateEntity(basicUrl, tag);
};

export const deleteDebtTag = async (tagId: string): Promise<boolean> => {
    return await deleteEntity(basicUrl, tagId);
};

export const assignTagsToDebt = async (debtId: string, tagIds: string[]): Promise<boolean | void> => {
    return await createEntity<string[], void>(`${basicUrl}/debt/${debtId}`, tagIds);
};
