import axios from "axios";

export class ApiException extends Error {
    public readonly statusCode?: number;
    public readonly errorCode?: string;
    public readonly detail?: string;

    constructor(message: string, statusCode?: number, errorCode?: string, detail?: string) {
        super(message);
        this.name = "ApiException";
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.detail = detail;
    }
}

export const parseErrorMessage = (error: unknown, defaultMessage?: string): string => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.detail 
            || error.response?.data?.errorMessage 
            || error.response?.data?.message 
            || error.response?.data?.title 
            || error.message 
            || defaultMessage 
            || "An unexpected error occurred";
    }
    if (error instanceof Error) {
        return error.message;
    }
    return typeof error === "string" ? error : (defaultMessage || "An unexpected error occurred");
};

export const parseErrorCode = (error: unknown): string | undefined => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.errorCode;
    }
    return undefined;
};

export const logPromiseError = (reason: unknown): never => {
    console.error(reason);
    if (reason instanceof Error) {
        throw reason;
    }
    throw new ApiException(typeof reason === "string" ? reason : "Unexpected error occurred");
};