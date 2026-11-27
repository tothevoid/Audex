import { useCallback, useMemo, useState } from 'react';
import { BaseEntity } from '@/models/common/BaseEntity';

export interface EditableGridDiff<TEntity> {
    added: TEntity[];
    updated: TEntity[];
    deletedIds: string[];
}

export interface EditableGridRow<TEntity> {
    row: TEntity;
    original?: TEntity;
    isAdded: boolean;
    isDeleted: boolean;
    isModified: boolean;
}

export interface UseEditableGridOptions<TEntity extends BaseEntity> {
    items: TEntity[];
    createRow: () => TEntity | null;
    cloneRow: (sourceRow: TEntity) => TEntity;
    onCommit: (diff: EditableGridDiff<TEntity>) => Promise<void>;
}

export const useEditableGrid = <TEntity extends BaseEntity>({
    items,
    createRow,
    cloneRow,
    onCommit,
}: UseEditableGridOptions<TEntity>) => {
    const [rows, setRows] = useState<TEntity[]>(() => items.map((item) => ({ ...item })));
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const originalMap = useMemo(() => {
        const map = new Map<string, TEntity>();
        items.forEach((item) => {
            map.set(item.id, item);
        });
        return map;
    }, [items]);

    const resetGridState = useCallback((targetItems: TEntity[]) => {
        setRows(targetItems.map((item) => ({ ...item })));
        setAddedIds(new Set());
        setDeletedIds(new Set());
        setModifiedIds(new Set());
    }, []);

    const [previousItems, setPreviousItems] = useState<TEntity[]>(items);
    if (items !== previousItems) {
        setPreviousItems(items);
        resetGridState(items);
    }

    const handleResetAll = useCallback(() => {
        resetGridState(items);
    }, [items, resetGridState]);

    const handleRowChange = useCallback(
        (id: string, updatedRow: TEntity) => {
            setRows((previousRows) => previousRows.map((row) => (row.id === id ? updatedRow : row)));

            if (!addedIds.has(id)) {
                setModifiedIds((previousModifiedIds) => {
                    if (previousModifiedIds.has(id)) {
                        return previousModifiedIds;
                    }
                    return new Set(previousModifiedIds).add(id);
                });
            }
        },
        [addedIds]
    );

    const handleRowRevert = useCallback(
        (id: string) => {
            if (addedIds.has(id)) {
                setRows((previousRows) => previousRows.filter((row) => row.id !== id));
                setAddedIds((previousAddedIds) => {
                    const nextAddedIds = new Set(previousAddedIds);
                    nextAddedIds.delete(id);
                    return nextAddedIds;
                });
                return;
            }

            const originalItem = originalMap.get(id);
            if (originalItem) {
                const restoredRow = { ...originalItem };
                setRows((previousRows) =>
                    previousRows.map((row) => (row.id === id ? restoredRow : row))
                );
            }

            setModifiedIds((previousModifiedIds) => {
                if (!previousModifiedIds.has(id)) {
                    return previousModifiedIds;
                }
                const nextModifiedIds = new Set(previousModifiedIds);
                nextModifiedIds.delete(id);
                return nextModifiedIds;
            });

            setDeletedIds((previousDeletedIds) => {
                if (!previousDeletedIds.has(id)) {
                    return previousDeletedIds;
                }
                const nextDeletedIds = new Set(previousDeletedIds);
                nextDeletedIds.delete(id);
                return nextDeletedIds;
            });
        },
        [addedIds, originalMap]
    );

    const handleAddRow = useCallback(() => {
        const newRow = createRow();
        if (!newRow) {
            return;
        }

        setRows((previousRows) => [newRow, ...previousRows]);
        setAddedIds((previousAddedIds) => new Set(previousAddedIds).add(newRow.id));
    }, [createRow]);

    const handleDuplicateRow = useCallback(
        (sourceRow: TEntity) => {
            const duplicatedRow = cloneRow(sourceRow);

            setRows((previousRows) => [duplicatedRow, ...previousRows]);
            setAddedIds((previousAddedIds) => new Set(previousAddedIds).add(duplicatedRow.id));
        },
        [cloneRow]
    );

    const handleDeleteRow = useCallback(
        (id: string) => {
            if (addedIds.has(id)) {
                setRows((previousRows) => previousRows.filter((row) => row.id !== id));
                setAddedIds((previousAddedIds) => {
                    const nextAddedIds = new Set(previousAddedIds);
                    nextAddedIds.delete(id);
                    return nextAddedIds;
                });
                return;
            }

            setDeletedIds((previousDeletedIds) => new Set(previousDeletedIds).add(id));
        },
        [addedIds]
    );

    const commit = useCallback(async () => {
        const diffToCommit: EditableGridDiff<TEntity> = {
            added: rows.filter((row) => addedIds.has(row.id)),
            updated: rows.filter((row) => modifiedIds.has(row.id) && !deletedIds.has(row.id)),
            deletedIds: Array.from(deletedIds),
        };

        setIsSaving(true);
        try {
            await onCommit(diffToCommit);
        } finally {
            setIsSaving(false);
        }
    }, [rows, addedIds, modifiedIds, deletedIds, onCommit]);

    const modifiedCount = modifiedIds.size;
    const addedCount = addedIds.size;
    const deletedCount = deletedIds.size;
    const hasChanges = modifiedCount > 0 || addedCount > 0 || deletedCount > 0;

    const gridRows = useMemo((): EditableGridRow<TEntity>[] => {
        return rows.map((row) => ({
            row,
            original: originalMap.get(row.id),
            isAdded: addedIds.has(row.id),
            isDeleted: deletedIds.has(row.id),
            isModified: modifiedIds.has(row.id),
        }));
    }, [rows, originalMap, addedIds, deletedIds, modifiedIds]);

    return {
        rows: gridRows,
        isSaving,
        hasChanges,
        modifiedCount,
        addedCount,
        deletedCount,
        commit,
        handleRowChange,
        handleRowRevert,
        handleAddRow,
        handleDuplicateRow,
        handleDeleteRow,
        handleResetAll,
    };
};
