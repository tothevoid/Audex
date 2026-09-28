import { downloadFileByConfig, FileDownloadResult, getEntityByConfig } from '@/api/basicApi';
import { BackupValidationResult, RestoreBackupResult } from '@/models/system/backupModels';
import { Nullable } from '@/shared/utilities/nullable';
import { parseErrorMessage } from '@/shared/utilities/webApiUtilities';

const basicUrl = '/DatabaseBackup';

export type ExportBackupResponse = FileDownloadResult;

export const exportDatabaseBackup = async (password?: string): Promise<Nullable<ExportBackupResponse>> => {
    return await downloadFileByConfig(`${basicUrl}/export`, { password: password || null });
};

export const validateDatabaseBackup = async (file: File, password?: string): Promise<BackupValidationResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (password) {
        formData.append('password', password);
    }

    try {
        const response = await getEntityByConfig<BackupValidationResult>(`${basicUrl}/validate`, formData);
        return response ?? {
            isValid: false,
            isEncrypted: false,
            errorMessage: 'Failed to validate backup file'
        };
    } catch (e: unknown) {
        console.error(e);
        return {
            isValid: false,
            isEncrypted: false,
            errorMessage: parseErrorMessage(e, 'Failed to validate backup file')
        };
    }
};

export const restoreDatabaseBackup = async (file: File, password?: string): Promise<RestoreBackupResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (password) {
        formData.append('password', password);
    }

    try {
        const response = await getEntityByConfig<RestoreBackupResult>(`${basicUrl}/restore`, formData);
        return response ?? {
            success: false,
            message: 'Failed to restore database from backup'
        };
    } catch (e: unknown) {
        console.error(e);
        return {
            success: false,
            message: parseErrorMessage(e, 'Failed to restore database from backup')
        };
    }
};
