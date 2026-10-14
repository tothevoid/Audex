import { ScheduledTaskEntity, ScheduledTaskEntityResponse, UpdateScheduleEntityRequest } from '@/models/scheduler/ScheduledTaskEntity';
import { CreateScheduledTaskEntityRequest, ScheduledTaskDefinitionEntity, ScheduledTaskDefinitionEntityResponse } from '@/models/scheduler/ScheduledTaskDefinitionEntity';
import { prepareScheduledTask } from './schedulerTaskApiMapping';
import { deleteAction, getAllEntities, getEntity, postAction, postEntityResult, putAction } from '@/api/basicApi';
import { OperationResult } from '@/shared/models/OperationResult';

const basicUrl = 'api/Scheduler';

export const getNotScheduledTasks = async (): Promise<ScheduledTaskDefinitionEntity[]> => {
    const responses = await getAllEntities<ScheduledTaskDefinitionEntityResponse>(`${basicUrl}/NotScheduledTasks`);
    return responses ?? [];
};

export const createScheduledTask = async (
    request: CreateScheduledTaskEntityRequest
): Promise<OperationResult<ScheduledTaskEntity>> => {
    return await postEntityResult<CreateScheduledTaskEntityRequest, ScheduledTaskEntityResponse, ScheduledTaskEntity>(
        `${basicUrl}/Tasks`,
        request,
        prepareScheduledTask
    );
};

export const deleteScheduledTask = async (taskName: string): Promise<boolean> => {
    return await deleteAction(`${basicUrl}/Tasks/${taskName}`);
};

export const getScheduledTasks = async (): Promise<ScheduledTaskEntity[]> => {
    const responses = await getAllEntities<ScheduledTaskEntityResponse>(`${basicUrl}/Tasks`);
    return (responses ?? []).map(prepareScheduledTask);
};

export const getScheduledTask = async (taskName: string): Promise<ScheduledTaskEntity | null> => {
    const response = await getEntity<ScheduledTaskEntityResponse>(`${basicUrl}/Tasks/${taskName}`);
    return response ? prepareScheduledTask(response) : null;
};

export const updateSchedule = async (
    taskName: string,
    request: UpdateScheduleEntityRequest
): Promise<boolean> => {
    return await putAction(`${basicUrl}/Tasks/${taskName}/Schedule`, request);
};

export const toggleTaskStatus = async (
    taskName: string,
    isEnabled: boolean
): Promise<boolean> => {
    return await putAction(`${basicUrl}/Tasks/${taskName}/Toggle?isEnabled=${isEnabled}`);
};

export const runTaskNow = async (taskName: string): Promise<boolean> => {
    return await postAction(`${basicUrl}/Tasks/${taskName}/RunNow`);
};
