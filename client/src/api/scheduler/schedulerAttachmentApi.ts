import { downloadFileByUrl } from '@/api/basicApi';

const basicUrl = 'api/Scheduler';

export const getAttachmentDownloadUrl = (attachmentId: string): string => {
    return `/${basicUrl}/journal/attachments/${attachmentId}/download`;
};

export const downloadAttachmentFile = async (attachmentId: string): Promise<Blob | null> => {
    return downloadFileByUrl(`/${basicUrl}/journal/attachments/${attachmentId}/download`);
};

