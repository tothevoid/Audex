import { ScheduledTaskEntity, ScheduledTaskEntityResponse } from '@/models/scheduler/ScheduledTaskEntity';

export const prepareScheduledTask = (
    response: ScheduledTaskEntityResponse
): ScheduledTaskEntity => ({
    taskName: response.taskName,
    displayName: response.displayName,
    description: response.description,
    cronExpression: response.cronExpression,
    isEnabled: response.isEnabled,
    nextExecutionUtc: response.nextExecutionUtc ? new Date(response.nextExecutionUtc) : undefined,
    lastExecutionUtc: response.lastExecutionUtc ? new Date(response.lastExecutionUtc) : undefined,
    lastExecutionStatus: response.lastExecutionStatus,
    lastExecutionDurationMs: response.lastExecutionDurationMs,
    category: response.category
});
