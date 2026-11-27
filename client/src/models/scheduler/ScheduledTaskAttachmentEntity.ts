import { BaseEntity } from '@/models/common/BaseEntity';

export interface ScheduledTaskAttachmentEntity extends BaseEntity {
    occurrenceId: string;
    fileName: string;
    storagePath: string;
    contentType: string;
    fileSizeBytes: number;
    createdAt: Date;
}

export interface ScheduledTaskAttachmentEntityResponse extends BaseEntity {
    occurrenceId: string;
    fileName: string;
    storagePath: string;
    contentType: string;
    fileSizeBytes: number;
    createdAt: string;
}
