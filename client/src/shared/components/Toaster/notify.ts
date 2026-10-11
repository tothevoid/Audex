import React from "react";
import type { ToastPromiseOptions } from "@chakra-ui/react";
import { toaster } from "./toasterInstance";

export interface NotifyAction {
    label: string;
    onClick: () => void;
}

export type NotifyPromiseMessages<TData> = ToastPromiseOptions<TData>;

export interface NotifyOptions {
    description?: React.ReactNode;
    duration?: number;
    closable?: boolean;
    action?: NotifyAction;
    id?: string;
}

type ToastType = "success" | "error" | "warning" | "info" | "loading";

const normalizeOptions = (options?: NotifyOptions | string): NotifyOptions | undefined => {
    if (typeof options === "string") {
        return { description: options };
    }
    return options;
};

const showToast = (
    type: ToastType,
    title: string,
    defaultDuration: number | undefined,
    options?: NotifyOptions | string
): string => {
    const parsedOptions = normalizeOptions(options);
    return toaster.create({
        title,
        description: parsedOptions?.description,
        type,
        ...(defaultDuration !== undefined ? { duration: parsedOptions?.duration ?? defaultDuration } : {}),
        closable: parsedOptions?.closable ?? true,
        ...(parsedOptions?.action ? { action: parsedOptions.action } : {}),
        ...(parsedOptions?.id ? { id: parsedOptions.id } : {}),
    });
};

export const notify = {
    success: (title: string, options?: NotifyOptions | string): string =>
        showToast("success", title, 4000, options),

    error: (title: string, options?: NotifyOptions | string): string =>
        showToast("error", title, 6000, options),

    warning: (title: string, options?: NotifyOptions | string): string =>
        showToast("warning", title, 5000, options),

    info: (title: string, options?: NotifyOptions | string): string =>
        showToast("info", title, 4500, options),

    loading: (title: string, options?: NotifyOptions | string): string =>
        showToast("loading", title, undefined, options),

    promise: <TData>(
        promise: Promise<TData>,
        messages: NotifyPromiseMessages<TData>
    ) => toaster.promise(promise, messages),

    dismiss: (id?: string): void => {
        toaster.dismiss(id);
    },
};

export default notify;
