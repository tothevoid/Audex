import { useCallback } from "react";
import { useSignalR } from "./useSignalR";
import { ScheduledTaskExecutionStatus } from "@/models/scheduler/ScheduledTaskEntity";
import { ServerNotificationEvents } from "@/shared/constants/serverNotificationEvents";

export interface TaskExecutionRecordedPayload {
    taskName: string;
    status: ScheduledTaskExecutionStatus;
    durationMs: number;
    errorMessage?: string;
}

export interface SchedulerEventsHandlers {
    onTaskStarted?: (taskName: string) => void;
    onTaskExecutionRecorded?: (payload: TaskExecutionRecordedPayload) => void;
}

export const useSchedulerEvents = ({
    onTaskStarted,
    onTaskExecutionRecorded,
}: SchedulerEventsHandlers): void => {
    const handleTaskStarted = useCallback((taskName: string) => {
        if (!taskName) {
            return;
        }

        onTaskStarted?.(taskName);
    }, [onTaskStarted]);

    const handleTaskExecutionRecorded = useCallback((payload: TaskExecutionRecordedPayload) => {
        if (!payload) {
            return;
        }

        onTaskExecutionRecorded?.(payload);
    }, [onTaskExecutionRecorded]);

    useSignalR<string>(ServerNotificationEvents.ScheduledTaskStarted, handleTaskStarted);
    useSignalR<TaskExecutionRecordedPayload>(ServerNotificationEvents.ScheduledTaskExecutionRecorded, handleTaskExecutionRecorded);
};
