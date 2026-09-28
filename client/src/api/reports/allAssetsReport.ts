import { downloadFileByUrl } from '@/api/basicApi';

export const downloadAllAssetsReportXlsx = async (): Promise<Blob | null> => {
    return downloadFileByUrl('/AllAssetsReport/xlsx');
};
