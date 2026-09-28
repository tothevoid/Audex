import { ScheduledTaskAttachmentEntity, ScheduledTaskAttachmentEntityResponse } from '@/models/scheduler/ScheduledTaskAttachmentEntity';
import { ScheduledTaskJournalEntity, ScheduledTaskJournalEntityResponse } from '@/models/scheduler/ScheduledTaskJournalEntity';

export const prepareScheduledTaskAttachment = (
    response: ScheduledTaskAttachmentEntityResponse
): ScheduledTaskAttachmentEntity => ({
    id: response.id,
    occurrenceId: response.occurrenceId,
    fileName: response.fileName,
    storagePath: response.storagePath,
    contentType: response.contentType,
    fileSizeBytes: response.fileSizeBytes,
    createdAt: new Date(response.createdAt)
});

export const prepareScheduledTaskJournal = (
    response: ScheduledTaskJournalEntityResponse
): ScheduledTaskJournalEntity => ({
    id: response.id,
    taskName: response.taskName,
    displayName: response.displayName,
    executedAtUtc: new Date(response.executedAtUtc),
    durationMs: response.durationMs,
    status: response.status,
    triggerSource: response.triggerSource,
    logMessage: response.logMessage,
    errorMessage: response.errorMessage,
    attachments: (response.attachments || []).map(prepareScheduledTaskAttachment)
});
