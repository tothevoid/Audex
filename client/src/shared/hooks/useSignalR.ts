import { useEffect, useRef } from "react";
import { signalRService } from "@/shared/services/signalRService";
import { ServerNotificationEventName } from "@/shared/constants/serverNotificationEvents";

export const useSignalR = <TPayload = unknown>(
    eventName: ServerNotificationEventName | string,
    handler: (payload: TPayload) => Promise<void> | void
): void => {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        const handleEvent = (payload: TPayload) => {
            if (handlerRef.current) {
                handlerRef.current(payload);
            }
        };

        signalRService.on<TPayload>(eventName, handleEvent);

        return () => {
            signalRService.off<TPayload>(eventName, handleEvent);
        };
    }, [eventName]);
};

export default useSignalR;
