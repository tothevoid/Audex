import { useCallback } from "react";
import { useSignalR } from "./useSignalR";
import { ScheduledTaskExecutionStatus } from "@/models/scheduler/ScheduledTaskEntity";

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
}: SchedulerEventsHandlers) => {
    const handleSignalRMessage = useCallback((rawMessage: string) => {
        try {
            const data = typeof rawMessage === "string" ? JSON.parse(rawMessage) : rawMessage;
            if (data?.type === "ScheduledTaskStarted" && data.taskName) {
                onTaskStarted?.(data.taskName);
            } else if (data?.type === "ScheduledTaskExecutionRecorded" && data.taskName) {
                onTaskExecutionRecorded?.({
                    taskName: data.taskName,
                    status: data.status as ScheduledTaskExecutionStatus,
                    durationMs: data.durationMs,
                    errorMessage: data.errorMessage
                });
            }
        } catch {
            // Ignore non-JSON or irrelevant messages
        }
    }, [onTaskStarted, onTaskExecutionRecorded]);

    useSignalR(handleSignalRMessage);
};
