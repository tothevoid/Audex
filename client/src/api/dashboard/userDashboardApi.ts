import httpClient from "@/api/httpClient";
import { getAllEntities, getEntity, getEntityById, deleteAction, postAction } from "@/api/basicApi";
import {
    CreateUserDashboardRequest,
    RenameUserDashboardRequest,
    UpdateUserDashboardLayoutRequest,
    UserDashboardEntity
} from "@/models/dashboard/UserDashboardEntity";
import { Nullable } from "@/shared/utilities/nullable";

const basicUrl = 'UserDashboard';

export const getAllUserDashboards = async (): Promise<UserDashboardEntity[]> => {
    return await getAllEntities<UserDashboardEntity>(`${basicUrl}/GetAll`);
};

export const getUserDashboardById = async (id: string): Promise<Nullable<UserDashboardEntity>> => {
    const result = await getEntityById<UserDashboardEntity>(basicUrl, id);
    return result ?? null;
};

export const getDefaultUserDashboard = async (): Promise<Nullable<UserDashboardEntity>> => {
    const result = await getEntity<UserDashboardEntity>(`${basicUrl}/GetDefault`);
    return result ?? null;
};

export const createUserDashboard = async (request: CreateUserDashboardRequest): Promise<UserDashboardEntity | null> => {
    const response = await httpClient.post<UserDashboardEntity>(`${basicUrl}/Create`, request);
    return response.data ?? null;
};

export const updateUserDashboardLayout = async (request: UpdateUserDashboardLayoutRequest): Promise<UserDashboardEntity | null> => {
    const response = await httpClient.put<UserDashboardEntity>(`${basicUrl}/UpdateLayout`, request);
    return response.data ?? null;
};

export const renameUserDashboard = async (request: RenameUserDashboardRequest): Promise<UserDashboardEntity | null> => {
    const response = await httpClient.put<UserDashboardEntity>(`${basicUrl}/Rename`, request);
    return response.data ?? null;
};

export const setDefaultUserDashboard = async (id: string): Promise<void> => {
    await postAction(`${basicUrl}/SetDefault?id=${id}`);
};

export const deleteUserDashboard = async (id: string): Promise<void> => {
    await deleteAction(`${basicUrl}/Delete?id=${id}`);
};
