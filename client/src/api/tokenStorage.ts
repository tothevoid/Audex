import { Nullable } from "@/shared/utilities/nullable";

let inMemoryAccessToken: Nullable<string> = null;

export const setAccessToken = (token: Nullable<string>): void => {
    inMemoryAccessToken = token;
};

export const getAccessToken = (): Nullable<string> => {
    return inMemoryAccessToken;
};

export const clearAccessToken = (): void => {
    inMemoryAccessToken = null;
};
