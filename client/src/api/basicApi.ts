import httpClient from "./httpClient";
import { PaginationConfig } from "../shared/models/PaginationConfig";
import { PagedResult } from "../shared/models/PagedResult";
import { OperationResult } from "../shared/models/OperationResult";
import { Nullable } from "../shared/utilities/nullable";
import { logPromiseError } from "../shared/utilities/webApiUtilities";

export const getAllEntities = async <T>(basicUrl: string): Promise<T[]> => {
    const entities = await httpClient.get(basicUrl)
        .then((response) => response.data)
        .catch(logPromiseError);

    return entities ?? [] as T[];
};

export const getAllEntitiesByConfig = async <TInput, TOutput>(basicUrl: string, data: TInput): Promise<TOutput[]> => {
    const entities = await httpClient.post(basicUrl, data)
        .then((response) => response.data)
        .catch(logPromiseError);

    return entities ?? [] as TOutput[];
};

export const getPagedEntities = async <TInput, TOutput>(basicUrl: string, data: TInput): Promise<PagedResult<TOutput>> => {
    const pagedResult = await httpClient.post<PagedResult<TOutput>>(basicUrl, data)
        .then((response) => response.data)
        .catch(logPromiseError);

    return pagedResult ?? { items: [], totalCount: 0, pageIndex: 0, pageSize: 0 };
};

export const createEntity = async <TRequest, TResponse>(basicUrl: string, addedEntity: TRequest): Promise<TResponse | void> => {
    return sendCreateRequest(basicUrl, addedEntity, (id) => { return { ...addedEntity, id } as TResponse; });
};

export const createAndGetFullEntity = async <TRequest, TResponse>(basicUrl: string, addedEntity: TRequest): Promise<TResponse | void> => {
    return sendCreateRequest(basicUrl, addedEntity, (createdEntity) => { return { ...createdEntity } as TResponse; });
};

export const createEntityWithIcon = async <TRequest, TResponse>(
    basicUrl: string,
    addedEntity: TRequest,
    entityFieldName: string,
    iconFieldName: string,
    file: Nullable<File>
): Promise<TResponse | void> => {
    return await httpClient.put(basicUrl, generateForm(addedEntity, entityFieldName, iconFieldName, file))
        .then((response) => response.data)
        .then(responseEntity => {
            return { ...responseEntity } as TResponse;
        })
        .catch(logPromiseError);
};

export const updateEntity = async <TRequest>(basicUrl: string, modifiedEntity: TRequest): Promise<boolean> => {
    const updatedEntity = await httpClient.patch(basicUrl, modifiedEntity)
        .then(() => true)
        .catch(logPromiseError);

    return updatedEntity ?? false;
};

export const updateEntityWithIcon = async <TRequest, TResponse>(
    basicUrl: string,
    modifiedEntity: TRequest,
    entityFieldName: string,
    iconFieldName: string,
    file: Nullable<File>
): Promise<TResponse | void> => {
    return await httpClient.patch(basicUrl, generateForm(modifiedEntity, entityFieldName, iconFieldName, file))
        .then((response) => response.data)
        .then(responseEntity => {
            return { ...responseEntity } as TResponse;
        })
        .catch(logPromiseError);
};

export const deleteEntity = async (basicUrl: string, recordId: string): Promise<boolean> => {
    if (!recordId) {
        return false;
    }

    const url = `${basicUrl}?id=${recordId}`;
    const result = await httpClient.delete(url)
        .then(() => true)
        .catch(logPromiseError);

    return result ?? false;
};

export const getEntity = async <T>(basicUrl: string): Promise<T | void> => {
    const entity: T | void = await httpClient.get(`${basicUrl}`)
        .then((response) => response.data)
        .catch(logPromiseError);
    return entity;
};

export const getEntityByConfig = async <T>(basicUrl: string, body: unknown): Promise<T | void> => {
    return await httpClient.post(basicUrl, body)
        .then((response) => response.data)
        .catch(logPromiseError);
};

export const getEntityById = async <T>(basicUrl: string, id: string): Promise<T | void> => {
    return getEntity(`${basicUrl}/GetById?id=${id}`);
};
const parseErrorMessage = (e: any): string => {
    return e?.response?.data?.detail 
        || e?.response?.data?.errorMessage 
        || e?.response?.data?.title 
        || e?.message 
        || "An unexpected error occurred";
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
            errorMessage: response.data?.errorMessage
        };
    } catch (e: any) {
        logPromiseError(e);
        return {
            isSuccess: false,
            errorMessage: parseErrorMessage(e)
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
            errorMessage: response.data?.errorMessage
        };
    } catch (e: any) {
        logPromiseError(e);
        return {
            isSuccess: false,
            errorMessage: parseErrorMessage(e)
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
            errorMessage: response.data?.errorMessage
        };
    } catch (e: any) {
        logPromiseError(e);
        return {
            isSuccess: false,
            errorMessage: parseErrorMessage(e)
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
            errorMessage: response.data?.errorMessage
        };
    } catch (e: any) {
        logPromiseError(e);
        return {
            isSuccess: false,
            errorMessage: parseErrorMessage(e)
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
    } catch (e: any) {
        logPromiseError(e);
        return {
            isSuccess: false,
            errorMessage: parseErrorMessage(e)
        };
    }
};

export const sendCreateRequest = async <TRequest, TResponse>(
    basicUrl: string,
    addedEntity: TRequest,
    responseHandler: (response: TResponse) => TResponse
): Promise<TResponse | void> => {
    const newEntity = await httpClient.put(basicUrl, addedEntity)
        .then((response) => response.data)
        .then(responseHandler)
        .catch(logPromiseError);
    return newEntity;
};

export const getAction = async (url: string): Promise<boolean> => {
    const result = await httpClient.get(url)
        .then(() => true)
        .catch(logPromiseError);

    return result ?? false;
};

export const postAction = async (url: string, data: unknown): Promise<boolean> => {
    const result = await httpClient.post(url, data)
        .then(() => true)
        .catch(logPromiseError);

    return result ?? false;
};

export const getPagination = async (url: string): Promise<PaginationConfig | void> => {
    return await httpClient.get(url)
        .then((response) => response.data)
        .catch(logPromiseError);
};

export const downloadFileByUrl = async (url: string): Promise<Blob | null> => {
    try {
        const response = await httpClient.get(url, { responseType: "blob" });
        return response.data;
    } catch (e) {
        logPromiseError(e);
        return null;
    }
};

export default httpClient;