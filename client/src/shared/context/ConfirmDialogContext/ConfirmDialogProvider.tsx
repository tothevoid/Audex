import {
    useCallback,
    useRef,
    useState,
    ReactNode,
    FC,
} from "react";
import { useTranslation } from "react-i18next";
import {
    ConfirmDialogContext,
    ConfirmDialogCustomOptions,
    ConfirmDialogOptions,
} from "./ConfirmDialogContext";
import ConfirmDialog from "@/shared/components/ConfirmDialog/ConfirmDialog";

interface ConfirmDialogProviderProps {
    children: ReactNode;
}

export const ConfirmDialogProvider: FC<ConfirmDialogProviderProps> = ({ children }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [currentOptions, setCurrentOptions] = useState<ConfirmDialogOptions | null>(null);

    const resolvePromiseRef = useRef<((value: boolean) => void) | null>(null);

    const handleClose = useCallback((confirmed: boolean) => {
        setIsOpen(false);
        if (resolvePromiseRef.current) {
            resolvePromiseRef.current(confirmed);
            resolvePromiseRef.current = null;
        }
    }, []);

    const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
        if (resolvePromiseRef.current) {
            resolvePromiseRef.current(false);
            resolvePromiseRef.current = null;
        }

        return new Promise<boolean>((resolve) => {
            resolvePromiseRef.current = resolve;
            setCurrentOptions(options);
            setIsOpen(true);
        });
    }, []);

    const confirmDelete = useCallback(
        (
            title: string,
            message?: ReactNode,
            confirmActionName?: string,
            overrides?: ConfirmDialogCustomOptions
        ): Promise<boolean> => {
            const options: ConfirmDialogOptions = {
                title,
                message: message ?? overrides?.message ?? t("modals_delete_message"),
                confirmActionName:
                    confirmActionName ??
                    overrides?.confirmActionName ??
                    t("modals_delete_button"),
                cancelActionName:
                    overrides?.cancelActionName ?? t("modals_cancel_button"),
                isDestructive: overrides?.isDestructive ?? true,
                maxW: overrides?.maxW,
            };

            return confirm(options);
        },
        [confirm, t]
    );

    const confirmAction = useCallback(
        (
            title: string,
            message?: ReactNode,
            actionName?: string,
            isDestructive?: boolean,
            overrides?: ConfirmDialogCustomOptions
        ): Promise<boolean> => {
            const options: ConfirmDialogOptions = {
                title,
                message: message ?? overrides?.message,
                confirmActionName:
                    actionName ??
                    overrides?.confirmActionName ??
                    t("modals_confirm_button"),
                cancelActionName:
                    overrides?.cancelActionName ?? t("modals_cancel_button"),
                isDestructive: overrides?.isDestructive ?? isDestructive ?? false,
                maxW: overrides?.maxW,
            };

            return confirm(options);
        },
        [confirm, t]
    );

    return (
        <ConfirmDialogContext.Provider
            value={{
                confirm,
                confirmDelete,
                confirmAction,
            }}
        >
            {children}
            <ConfirmDialog
                isOpen={isOpen}
                options={currentOptions}
                onConfirm={() => handleClose(true)}
                onCancel={() => handleClose(false)}
            />
        </ConfirmDialogContext.Provider>
    );
};

export default ConfirmDialogProvider;
