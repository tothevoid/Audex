import httpClient from '../httpClient';
import { ScheduledTaskEntity, ScheduledTaskEntityResponse, UpdateScheduleEntityRequest } from '../../models/scheduler/ScheduledTaskEntity';
import { CreateScheduledTaskEntityRequest, ScheduledTaskDefinitionEntity, ScheduledTaskDefinitionEntityResponse } from '../../models/scheduler/ScheduledTaskDefinitionEntity';
import { logPromiseError } from '../../shared/utilities/webApiUtilities';
import { prepareScheduledTask } from './schedulerTaskApiMapping';
import { getAllEntities, getEntity } from '../basicApi';

const basicUrl = 'api/Scheduler';

export const getNotScheduledTasks = async (): Promise<ScheduledTaskDefinitionEntity[]> => {
    return await getAllEntities<ScheduledTaskDefinitionEntityResponse>(`${basicUrl}/not-scheduled-tasks`)
        .then((responses) => responses || []);
};

export const createScheduledTask = async (
    request: CreateScheduledTaskEntityRequest
): Promise<ScheduledTaskEntity | null> => {
    try {
        const response = await httpClient.post(`${basicUrl}/tasks`, request);
        return response.data ? prepareScheduledTask(response.data) : null;
    } catch (error) {
        logPromiseError(error);
        return null;
    }
};

export const deleteScheduledTask = async (taskName: string): Promise<boolean> => {
    try {
        await httpClient.delete(`${basicUrl}/tasks/${taskName}`);
        return true;
    } catch (error) {
        logPromiseError(error);
        return false;
    }
};

export const getScheduledTasks = async (): Promise<ScheduledTaskEntity[]> => {
    return await getAllEntities<ScheduledTaskEntityResponse>(`${basicUrl}/tasks`)
        .then((responses) => (responses || []).map(prepareScheduledTask));
};

export const getScheduledTask = async (taskName: string): Promise<ScheduledTaskEntity | null> => {
    return await getEntity<ScheduledTaskEntityResponse>(`${basicUrl}/tasks/${taskName}`)
        .then((response) => response ? prepareScheduledTask(response) : null);
};

export const updateSchedule = async (
    taskName: string,
    request: UpdateScheduleEntityRequest
): Promise<boolean> => {
    try {
        await httpClient.put(`${basicUrl}/tasks/${taskName}/schedule`, request);
        return true;
    } catch (error) {
        logPromiseError(error);
        return false;
    }
};

export const toggleTaskStatus = async (
    taskName: string,
    isEnabled: boolean
): Promise<boolean> => {
    try {
        await httpClient.put(`${basicUrl}/tasks/${taskName}/toggle?isEnabled=${isEnabled}`);
        return true;
    } catch (error) {
        logPromiseError(error);
        return false;
    }
};

export const runTaskNow = async (taskName: string): Promise<boolean> => {
    try {
        await httpClient.post(`${basicUrl}/tasks/${taskName}/run-now`);
        return true;
    } catch (error) {
        logPromiseError(error);
        return false;
    }
};
