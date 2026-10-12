export enum ServerToastType {
    Info = 0,
    Success = 1,
    Warning = 2,
    Error = 3
}

export interface ServerToastPayload {
    title: string;
    description?: string;
    type?: ServerToastType;
    actionLabel?: string;
    actionUrl?: string;
    duration?: number;
}
