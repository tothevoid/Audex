import { useState, useRef, useCallback } from "react";
import { ActiveEntityMode } from "@/shared/enums/activeEntityMode";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";

export function useEntityModal<T>() {
    const [activeEntity, setActiveEntity] = useState<T | null>(null);
    const [mode, setMode] = useState<ActiveEntityMode>(ActiveEntityMode.None);

    const modalRef = useRef<BaseModalRef>(null);
    const confirmModalRef = useRef<BaseModalRef>(null);

    const onAddClicked = useCallback(() => {
        setActiveEntity(null);
        setMode(ActiveEntityMode.Add);
        modalRef.current?.openModal();
    }, []);

    const onEditClicked = useCallback((entity: T) => {
        setActiveEntity(entity);
        setMode(ActiveEntityMode.Edit);
        modalRef.current?.openModal();
    }, []);

    const onDeleteClicked = useCallback((entity: T) => {
        setActiveEntity(entity);
        setMode(ActiveEntityMode.Delete);
        confirmModalRef.current?.openModal();
    }, []);

    const onActionEnded = useCallback(() => {
        setActiveEntity(null);
        setMode(ActiveEntityMode.None);
    }, []);

    const handleDelete = useCallback((deleteAction: (entity: T) => Promise<void>) => {
        return async () => {
            if (!activeEntity) return;
            try {
                await deleteAction(activeEntity);
            } finally {
                onActionEnded();
            }
        };
    }, [activeEntity, onActionEnded]);

    const executeWithCleanup = useCallback(<Args extends any[]>(action: (...args: Args) => Promise<void>) => {
        return async (...args: Args) => {
            try {
                await action(...args);
            } finally {
                onActionEnded();
            }
        };
    }, [onActionEnded]);

    return {
        activeEntity,
        mode,
        modalRef,
        confirmModalRef,
        onAddClicked,
        onEditClicked,
        onDeleteClicked,
        setActiveEntity,
        onActionEnded,
        handleDelete,
        executeWithCleanup,
        setMode,
    };
}
