import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import config from "@/config";
import { getAccessToken, setAccessToken, clearAccessToken } from "./tokenStorage";
import { refreshToken } from "./auth/authApi";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
    _requestId?: string;
    _startTime?: number;
}

const httpClient = axios.create({
    baseURL: config.api.URL,
    withCredentials: true,
});

httpClient.interceptors.request.use((requestConfig: InternalAxiosRequestConfig) => {
    const customConfig = requestConfig as CustomAxiosRequestConfig;
    const token = getAccessToken();
    if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
    }

    const requestId = crypto.randomUUID();
    customConfig._requestId = requestId;
    customConfig._startTime = performance.now();
    requestConfig.headers["X-Request-Id"] = requestId;

    if (import.meta.env.DEV) {
        const httpMethod = requestConfig.method?.toUpperCase() ?? "GET";
        console.debug(`[Req ${requestId.slice(0, 8)}] ${httpMethod} ${requestConfig.url}`);
    }

    return requestConfig;
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(promiseItem => {
        if (error) {
            promiseItem.reject(error);
        } else if (token) {
            promiseItem.resolve(token);
        }
    });
    failedQueue = [];
};

const handleAuthFailure = (error: unknown) => {
    processQueue(error, null);
    clearAccessToken();
    if (!window.location.pathname.endsWith("/auth")) {
        window.location.href = "/auth";
    }
};

const shouldRefreshToken = (request: CustomAxiosRequestConfig): boolean => {
    const url = request.url ?? "";
    return !url.includes("/Auth/Login") && !url.includes("/Auth/RefreshToken");
};

const isRefreshableAuthError = (error: AxiosError, request?: CustomAxiosRequestConfig): request is CustomAxiosRequestConfig => {
    return !!(request && error.response?.status === 401 && !request._retry && shouldRefreshToken(request));
};

const waitForRefreshedToken = (request: CustomAxiosRequestConfig): Promise<AxiosResponse> => {
    return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
    }).then(token => {
        request.headers.Authorization = `Bearer ${token}`;
        return httpClient(request);
    });
};

const requestNewAccessToken = async (): Promise<string> => {
    const newAccessToken = await refreshToken();
    if (!newAccessToken) {
        throw new Error("No access token returned from refresh endpoint.");
    }
    return newAccessToken;
};

interface RequestLogMetadata {
    duration: number;
    requestId: string;
    httpMethod: string;
    url: string;
}

const getRequestLogMetadata = (requestConfig?: CustomAxiosRequestConfig): RequestLogMetadata => {
    const duration = requestConfig?._startTime ? Math.round(performance.now() - requestConfig._startTime) : 0;
    const requestId = (requestConfig?._requestId ?? "").slice(0, 8);
    const httpMethod = requestConfig?.method?.toUpperCase() ?? "GET";
    const url = requestConfig?.url ?? "";

    return { duration, requestId, httpMethod, url };
};

httpClient.interceptors.response.use(
    response => {
        if (import.meta.env.DEV) {
            const { duration, requestId, httpMethod, url } = getRequestLogMetadata(response.config as CustomAxiosRequestConfig);
            console.debug(`[Res ${requestId}] ${response.status} ${httpMethod} ${url} (${duration}ms)`);
        }
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

        if (originalRequest) {
            const { duration, requestId, httpMethod, url } = getRequestLogMetadata(originalRequest);
            const statusCode = error.response?.status ?? "ERR";
            console.error(`[API Error ${requestId}] ${statusCode} ${httpMethod} ${url} (${duration}ms):`, error);
        }

        if (!isRefreshableAuthError(error, originalRequest)) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return waitForRefreshedToken(originalRequest);
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const newAccessToken = await requestNewAccessToken();

            setAccessToken(newAccessToken);
            httpClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            processQueue(null, newAccessToken);
            return httpClient(originalRequest);
        } catch (refreshError: unknown) {
            handleAuthFailure(refreshError);
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default httpClient;
