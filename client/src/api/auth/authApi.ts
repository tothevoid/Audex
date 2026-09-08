import axios from 'axios';
import config from '../../config';
import { Nullable } from '../../shared/utilities/nullable';
import { setAccessToken, clearAccessToken, getAccessToken } from '../tokenStorage';

import {
    AuthErrorCode,
    AuthResult,
    ChangePasswordResult
} from '../../models/auth/AuthResult';
const basicUrl = `${config.api.URL}/Auth`;

const parseAuthError = (err: unknown): AuthErrorCode => {
    if (!axios.isAxiosError(err)) {
        return AuthErrorCode.Unknown;
    }

    if (!err.response) {
        return AuthErrorCode.ServerUnavailable;
    }

    if (err.response.status === 400 || err.response.status === 401) {
        return AuthErrorCode.InvalidCredentials;
    }

    return AuthErrorCode.Unknown;
};

export const auth = async (
    userName: string,
    password: Nullable<string>
): Promise<AuthResult> => {
    try {
        const response = await axios.post(
            `${basicUrl}/Login`,
            { userName, password: password ?? null },
            { withCredentials: true }
        );

        const data = response.data;
        if (data?.passwordChangeRequired) {
            return {
                success: true,
                passwordChangeRequired: true
            };
        }

        if (data?.accessToken) {
            setAccessToken(data.accessToken);
            return {
                success: true,
                passwordChangeRequired: false,
                token: data.accessToken
            };
        }

        return {
            success: false,
            errorCode: AuthErrorCode.Unknown
        };
    } catch (err) {
        return {
            success: false,
            errorCode: parseAuthError(err)
        };
    }
};

export const changePassword = async (
    userName: string,
    currentPassword: Nullable<string>,
    newPassword: string
): Promise<ChangePasswordResult> => {
    try {
        const response = await axios.post(
            `${basicUrl}/ChangePassword`,
            { userName, currentPassword, newPassword },
            { withCredentials: true }
        );

        const data = response.data;
        if (data?.accessToken) {
            setAccessToken(data.accessToken);
            return {
                success: true,
                token: data.accessToken
            };
        }

        return {
            success: false,
            errorCode: AuthErrorCode.Unknown
        };
    } catch (err) {
        return {
            success: false,
            errorCode: parseAuthError(err)
        };
    }
};

let inFlightRefreshPromise: Nullable<Promise<Nullable<string>>> = null;

export const refreshToken = async (): Promise<Nullable<string>> => {
    if (inFlightRefreshPromise) {
        return inFlightRefreshPromise;
    }

    inFlightRefreshPromise = (async () => {
        try {
            const response = await axios.post(
                `${basicUrl}/RefreshToken`,
                {},
                { withCredentials: true }
            );

            const data = response.data;
            if (data?.accessToken) {
                setAccessToken(data.accessToken);
                return data.accessToken;
            }

            return null;
        } catch {
            clearAccessToken();
            return null;
        } finally {
            inFlightRefreshPromise = null;
        }
    })();

    return inFlightRefreshPromise;
};

export const logout = async (): Promise<void> => {
    try {
        await axios.post(
            `${basicUrl}/RevokeToken`,
            {},
            { withCredentials: true }
        );
    } catch {
        // Ignore network/server errors on logout
    } finally {
        clearAccessToken();
        if (!window.location.pathname.endsWith('/auth')) {
            window.location.href = '/auth';
        }
    }
};

export const revokeAll = async (): Promise<void> => {
    try {
        const token = getAccessToken();
        await axios.post(
            `${basicUrl}/RevokeAll`,
            {},
            {
                withCredentials: true,
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            }
        );
    } catch {
        // Ignore network/server errors on revoke all
    } finally {
        clearAccessToken();
        if (!window.location.pathname.endsWith('/auth')) {
            window.location.href = '/auth';
        }
    }
};

