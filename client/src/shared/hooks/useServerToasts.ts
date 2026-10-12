import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ServerToastPayload, ServerToastType } from "@/models/toasts/ServerToastPayload";
import { ServerNotificationEvents } from "@/shared/constants/serverNotificationEvents";
import { useSignalR } from "./useSignalR";
import { notify } from "@/shared/components/Toaster";

export const useServerToasts = (): void => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleToastReceived = useCallback((toastPayload: ServerToastPayload) => {
        if (!toastPayload) {
            return;
        }

        const toastTitle = toastPayload.title || t("toast_notification_new");
        const toastDescription = toastPayload.description;

        const actionConfig = toastPayload.actionUrl
            ? {
                label: toastPayload.actionLabel || t("notifications_go_to"),
                onClick: () => {
                    navigate(toastPayload.actionUrl!);
                }
            }
            : undefined;

        const toastOptions = {
            description: toastDescription,
            action: actionConfig,
            duration: toastPayload.duration
        };

        switch (toastPayload.type) {
            case ServerToastType.Success:
                notify.success(toastTitle, toastOptions);
                break;
            case ServerToastType.Warning:
                notify.warning(toastTitle, toastOptions);
                break;
            case ServerToastType.Error:
                notify.error(toastTitle, toastOptions);
                break;
            case ServerToastType.Info:
            default:
                notify.info(toastTitle, toastOptions);
                break;
        }
    }, [navigate, t]);

    useSignalR<ServerToastPayload>(
        ServerNotificationEvents.ToastReceived,
        handleToastReceived
    );
};

export default useServerToasts;
