import { downloadFileByUrl } from '@/api/basicApi';

const basicUrl = 'api/Scheduler';

export const getAttachmentDownloadUrl = (attachmentId: string): string => {
    return `/${basicUrl}/Journal/Attachments/${attachmentId}/Download`;
};

export const downloadAttachmentFile = async (attachmentId: string): Promise<Blob | null> => {
    return downloadFileByUrl(`/${basicUrl}/Journal/Attachments/${attachmentId}/Download`);
};

