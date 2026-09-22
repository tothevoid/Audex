export interface OperationResult<T> {
    isSuccess: boolean;
    data?: T;
    errorMessage?: string;
    errorCode?: string;
}
