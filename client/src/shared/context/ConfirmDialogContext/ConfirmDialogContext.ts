import { createContext, ReactNode } from "react";

export interface BaseConfirmDialogOptions {
    message?: ReactNode;
    confirmActionName?: string;
    cancelActionName?: string;
    isDestructive?: boolean;
    maxW?: string;
}

export interface ConfirmDialogOptions extends BaseConfirmDialogOptions {
    title: string;
}

export interface ConfirmDialogCustomOptions extends BaseConfirmDialogOptions {
    title?: string;
}

export interface ConfirmDialogContextType {
    confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
    confirmDelete: (
        title: string,
        message?: ReactNode,
        confirmActionName?: string,
        overrides?: ConfirmDialogCustomOptions
    ) => Promise<boolean>;
    confirmAction: (
        title: string,
        message?: ReactNode,
        actionName?: string,
        isDestructive?: boolean,
        overrides?: ConfirmDialogCustomOptions
    ) => Promise<boolean>;
}

export const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

