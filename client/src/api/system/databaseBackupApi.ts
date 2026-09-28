import httpClient from '@/api/httpClient';
import { BackupValidationResult, RestoreBackupResult } from '@/models/system/backupModels';
import { logPromiseError } from '@/shared/utilities/webApiUtilities';

export interface ExportBackupResponse {
    blob: Blob;
    fileName: string;
}

export const exportDatabaseBackup = async (password?: string): Promise<ExportBackupResponse | null> => {
    try {
        const response = await httpClient.post(
            '/DatabaseBackup/export',
            { password: password || null },
            { responseType: 'blob' }
        );

        const fileName = response.headers?.['x-file-name'];

        return {
            blob: response.data,
            fileName
        };
    } catch (e) {
        logPromiseError(e);
        return null;
    }
};

export const validateDatabaseBackup = async (file: File, password?: string): Promise<BackupValidationResult> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        if (password) {
            formData.append('password', password);
        }

        const response = await httpClient.post<BackupValidationResult>(
            '/DatabaseBackup/validate',
            formData
        );
        return response.data;
    } catch (e: unknown) {
        logPromiseError(e);
        const error = e as { response?: { data?: BackupValidationResult } };
        if (error.response?.data) {
            return error.response.data;
        }
        return {
            isValid: false,
            isEncrypted: false,
            errorMessage: 'Failed to validate backup file'
        };
    }
};

export const restoreDatabaseBackup = async (file: File, password?: string): Promise<RestoreBackupResult> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        if (password) {
            formData.append('password', password);
        }

        const response = await httpClient.post<RestoreBackupResult>(
            '/DatabaseBackup/restore',
            formData
        );
        return response.data;
    } catch (e: unknown) {
        logPromiseError(e);
        const error = e as { response?: { data?: RestoreBackupResult } };
        if (error.response?.data) {
            return error.response.data;
        }
        return {
            success: false,
            message: 'Failed to restore database from backup'
        };
    }
};
