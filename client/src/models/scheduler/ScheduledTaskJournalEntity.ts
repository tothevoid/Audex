import { BaseEntity } from '@/models/common/BaseEntity';
import { BasePageable } from '@/shared/models/BasePageable';
import { ScheduledTaskAttachmentEntity, ScheduledTaskAttachmentEntityResponse } from './ScheduledTaskAttachmentEntity';
import { ScheduledTaskExecutionStatus, ScheduledTaskTriggerSource } from './ScheduledTaskEntity';

export interface ScheduledTaskJournalEntity extends BaseEntity {
    taskName: string;
    displayName: string;
    executedAtUtc: Date;
    durationMs: number;
    status: ScheduledTaskExecutionStatus;
    triggerSource: ScheduledTaskTriggerSource;
    logMessage?: string;
    errorMessage?: string;
    attachments: ScheduledTaskAttachmentEntity[];
}

export interface ScheduledTaskJournalEntityResponse extends BaseEntity {
    taskName: string;
    displayName: string;
    executedAtUtc: string;
    durationMs: number;
    status: ScheduledTaskExecutionStatus;
    triggerSource: ScheduledTaskTriggerSource;
    logMessage?: string;
    errorMessage?: string;
    attachments?: ScheduledTaskAttachmentEntityResponse[];
}

export interface GetJournalQueryRequest extends BasePageable {
    taskName?: string;
    status?: ScheduledTaskExecutionStatus;
    triggerSource?: ScheduledTaskTriggerSource;
}
