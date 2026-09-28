import httpClient from "./httpClient";
import { PagedResult } from "@/shared/models/PagedResult";
import { OperationResult } from "@/shared/models/OperationResult";
import { Nullable } from "@/shared/utilities/nullable";
import { parseErrorCode, parseErrorMessage } from "@/shared/utilities/webApiUtilities";

export const getAllEntities = async <T>(basicUrl: string): Promise<T[]> => {
    const response = await httpClient.get<T[]>(basicUrl);
    return response.data ?? [];
};

export const getAllEntitiesByConfig = async <TInput, TOutput>(basicUrl: string, data: TInput): Promise<TOutput[]> => {
    const response = await httpClient.post<TOutput[]>(basicUrl, data);
    return response.data ?? [];
};

export const getPagedEntities = async <TInput, TOutput>(basicUrl: string, data: TInput): Promise<PagedResult<TOutput>> => {
    const response = await httpClient.post<PagedResult<TOutput>>(basicUrl, data);
    return response.data ?? { items: [], totalCount: 0, pageIndex: 0, pageSize: 0 };
};

export const createEntity = async <TRequest, TResponse>(basicUrl: string, addedEntity: TRequest): Promise<TResponse | void> => {
    return sendCreateRequest(basicUrl, addedEntity, (id) => { return { ...addedEntity, id } as TResponse; });
};

export const createAndGetFullEntity = async <TRequest, TResponse>(basicUrl: string, addedEntity: TRequest): Promise<TResponse | void> => {
    return sendCreateRequest(basicUrl, addedEntity, (createdEntity) => { return { ...createdEntity } as TResponse; });
};

const generateForm = <T>(entity: T, entityField: string, iconField: string, file: Nullable<File>) => {
    if (entityField === iconField) {
        throw new Error(`Entity field (${entityField}) same as icon field (${iconField})`);
    }

    const formData = new FormData();
    formData.append(entityField, JSON.stringify(entity));
    if (file) {
        formData.append(iconField, file);
    }
    return formData;
};

export const createEntityWithIcon = async <TRequest, TResponse>(
    basicUrl: string,
    addedEntity: TRequest,
    entityFieldName: string,
    iconFieldName: string,
    file: Nullable<File>
): Promise<TResponse | void> => {
    const response = await httpClient.put<TResponse>(basicUrl, generateForm(addedEntity, entityFieldName, iconFieldName, file));
    return response.data;
};

export const updateEntity = async <TRequest>(basicUrl: string, modifiedEntity: TRequest): Promise<boolean> => {
    await httpClient.patch(basicUrl, modifiedEntity);
    return true;
};

export const updateEntityWithIcon = async <TRequest, TResponse>(
    basicUrl: string,
    modifiedEntity: TRequest,
    entityFieldName: string,
    iconFieldName: string,
    file: Nullable<File>
): Promise<TResponse | void> => {
    const response = await httpClient.patch<TResponse>(basicUrl, generateForm(modifiedEntity, entityFieldName, iconFieldName, file));
    return response.data;
};

export const deleteEntity = async (basicUrl: string, recordId: string): Promise<boolean> => {
    if (!recordId) {
        return false;
    }

    const url = `${basicUrl}?id=${recordId}`;
    await httpClient.delete(url);
    return true;
};

export const getEntity = async <T>(basicUrl: string): Promise<T | void> => {
    const response = await httpClient.get<T>(basicUrl);
    return response.data;
};

export const getEntityByConfig = async <T>(basicUrl: string, body: unknown): Promise<T | void> => {
    const response = await httpClient.post<T>(basicUrl, body);
    return response.data;
};

export const getEntityById = async <T>(basicUrl: string, id: string): Promise<T | void> => {
    return getEntity(`${basicUrl}/GetById?id=${id}`);
};

export const createEntityResult = async <TRequest, TResponse, TMapped = TResponse>(
    basicUrl: string,
    addedEntity: TRequest,
    mapResponse?: (response: TResponse) => TMapped
): Promise<OperationResult<TMapped>> => {
    try {
        const response = await httpClient.put<OperationResult<TResponse>>(basicUrl, addedEntity);
        if (response.data?.isSuccess) {
            return {
                isSuccess: true,
                data: response.data.data 
                    ? (mapResponse ? mapResponse(response.data.data) : (response.data.data as unknown as TMapped))
                    : undefined
            };
        }
        return {
            isSuccess: false,
            errorMessage: response.data?.errorMessage,
            errorCode: response.data?.errorCode
        };
    } catch (e: unknown) {
        console.error(e);
        return {
            isSuccess: false,
            errorMessage: parseErrorMessage(e),
            errorCode: parseErrorCode(e)
        };
    }
};

export const createEntityWithIconResult = async <TRequest, TResponse, TMapped = TResponse>(
    basicUrl: string,
    addedEntity: TRequest,
    entityFieldName: string,
    iconFieldName: string,
    file: Nullable<File>,
    mapResponse?: (response: TResponse) => TMapped
): Promise<OperationResult<TMapped>> => {
    try {
        const formData = generateForm(addedEntity, entityFieldName, iconFieldName, file);
        const response = await httpClient.put<OperationResult<TResponse>>(basicUrl, formData);

        if (response.data?.isSuccess) {
            return {
                isSuccess: true,
                data: response.data.data 
                    ? (mapResponse ? mapResponse(response.data.data) : (response.data.data as unknown as TMapped))
                    : undefined
            };
        }

        return {
            isSuccess: false,
            errorMessage: response.data?.errorMessage,
            errorCode: response.data?.errorCode
        };
    } catch (e: unknown) {
        console.error(e);
        return {
            isSuccess: false,
            errorMessage: parseErrorMessage(e),
            errorCode: parseErrorCode(e)
        };
    }
};

export const updateEntityResult = async <TRequest, TResponse, TMapped = TResponse>(
    basicUrl: string,
    modifiedEntity: TRequest,
    mapResponse?: (response: TResponse) => TMapped
): Promise<OperationResult<TMapped>> => {
    try {
        const response = await httpClient.patch<OperationResult<TResponse>>(basicUrl, modifiedEntity);
        if (response.data?.isSuccess) {
            return {
                isSuccess: true,
                data: response.data.data 
                    ? (mapResponse ? mapResponse(response.data.data) : (response.data.data as unknown as TMapped))
                    : undefined
            };
        }
        return {
            isSuccess: false,
            errorMessage: response.data?.errorMessage,
            errorCode: response.data?.errorCode
        };
    } catch (e: unknown) {
        console.error(e);
        return {
            isSuccess: false,
            errorMessage: parseErrorMessage(e),
            errorCode: parseErrorCode(e)
        };
    }
};

export const updateEntityWithIconResult = async <TRequest, TResponse, TMapped = TResponse>(
    basicUrl: string,
    modifiedEntity: TRequest,
    entityFieldName: string,
    iconFieldName: string,
    file: Nullable<File>,
    mapResponse?: (response: TResponse) => TMapped
): Promise<OperationResult<TMapped>> => {
    try {
        const formData = generateForm(modifiedEntity, entityFieldName, iconFieldName, file);
        const response = await httpClient.patch<OperationResult<TResponse>>(basicUrl, formData);

        if (response.data?.isSuccess) {
            return {
                isSuccess: true,
                data: response.data.data 
                    ? (mapResponse ? mapResponse(response.data.data) : (response.data.data as unknown as TMapped))
                    : undefined
            };
        }

        return {
            isSuccess: false,
            errorMessage: response.data?.errorMessage,
            errorCode: response.data?.errorCode
        };
    } catch (e: unknown) {
        console.error(e);
        return {
            isSuccess: false,
            errorMessage: parseErrorMessage(e),
            errorCode: parseErrorCode(e)
        };
    }
};

export const postEntityResult = async <TRequest, TResponse, TMapped = TResponse>(
    basicUrl: string,
    data: TRequest,
    mapResponse?: (response: TResponse) => TMapped
): Promise<OperationResult<TMapped>> => {
    try {
        const response = await httpClient.post<OperationResult<TResponse>>(basicUrl, data);
        if (response.data?.isSuccess) {
            return {
                isSuccess: true,
                data: response.data.data 
                    ? (mapResponse ? mapResponse(response.data.data) : (response.data.data as unknown as TMapped))
                    : undefined
            };
        }
        return {
            isSuccess: false,
            errorMessage: response.data?.errorMessage,
            errorCode: response.data?.errorCode
        };
    } catch (e: unknown) {
        console.error(e);
        return {
            isSuccess: false,
            errorMessage: parseErrorMessage(e),
            errorCode: parseErrorCode(e)
        };
    }
};

export const deleteEntityResult = async (basicUrl: string, recordId: string): Promise<OperationResult<boolean>> => {
    if (!recordId) {
        return { isSuccess: false, errorMessage: "Invalid id" };
    }
    try {
        const response = await httpClient.delete<OperationResult<boolean>>(`${basicUrl}?id=${recordId}`);
        if (typeof response.data?.isSuccess === "boolean") {
            return response.data;
        }
        return { isSuccess: true, data: true };
    } catch (e: unknown) {
        console.error(e);
        return {
            isSuccess: false,
            errorMessage: parseErrorMessage(e),
            errorCode: parseErrorCode(e)
        };
    }
};

export const sendCreateRequest = async <TRequest, TResponse>(
    basicUrl: string,
    addedEntity: TRequest,
    responseHandler: (response: TResponse) => TResponse
): Promise<TResponse | void> => {
    const response = await httpClient.put<TResponse>(basicUrl, addedEntity);
    return responseHandler(response.data);
};

export const getAction = async (url: string): Promise<boolean> => {
    await httpClient.get(url);
    return true;
};

export const postAction = async (url: string, data?: unknown): Promise<boolean> => {
    await httpClient.post(url, data ?? {});
    return true;
};

export const putAction = async (url: string, data?: unknown): Promise<boolean> => {
    await httpClient.put(url, data ?? {});
    return true;
};

export const deleteAction = async (url: string): Promise<boolean> => {
    await httpClient.delete(url);
    return true;
};

export interface FileDownloadResult {
    blob: Blob;
    fileName?: string;
}

export const downloadFileByUrl = async (url: string): Promise<Blob | null> => {
    try {
        const response = await httpClient.get<Blob>(url, { responseType: "blob" });
        return response.data;
    } catch (e: unknown) {
        console.error(e);
        return null;
    }
};

export const downloadFileByConfig = async <TInput>(
    url: string,
    data: TInput
): Promise<Nullable<FileDownloadResult>> => {
    try {
        const response = await httpClient.post<Blob>(url, data, { responseType: "blob" });
        return {
            blob: response.data,
            fileName: response.headers?.["x-file-name"]
        };
    } catch (e: unknown) {
        console.error(e);
        return null;
    }
};

export default httpClient;