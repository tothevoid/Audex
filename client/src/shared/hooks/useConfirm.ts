import { useContext } from "react";
import {
    ConfirmDialogContext,
    ConfirmDialogContextType,
} from "@/shared/context/ConfirmDialogContext/ConfirmDialogContext";

export const useConfirm = (): ConfirmDialogContextType => {
    const context = useContext(ConfirmDialogContext);
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmDialogProvider");
    }
    return context;
};

export default useConfirm;
