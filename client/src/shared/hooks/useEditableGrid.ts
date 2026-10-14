import { useCallback, useMemo, useState } from 'react';
import { generateGuid } from '@/shared/utilities/idUtilities';

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

export interface UseEditableGridOptions<TEntity extends { id: string }> {
    items: TEntity[];
    createRow?: () => TEntity | null | undefined;
    cloneRow?: (sourceRow: TEntity) => TEntity;
    prepareRow?: (item: TEntity) => TEntity;
    onCommit?: (diff: EditableGridDiff<TEntity>) => Promise<void>;
}

export const useEditableGrid = <TEntity extends { id: string }>({
    items,
    createRow,
    cloneRow,
    prepareRow,
    onCommit,
}: UseEditableGridOptions<TEntity>) => {
    const prepareRows = useCallback(
        (itemsToPrepare: TEntity[]): TEntity[] => {
            if (prepareRow) {
                return itemsToPrepare.map(prepareRow);
            }

            return itemsToPrepare.map((item) => ({ ...item }));
        },
        [prepareRow]
    );

    const [rows, setRows] = useState<TEntity[]>(() => prepareRows(items));
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

    const resetGridState = useCallback(
        (targetItems: TEntity[]) => {
            setRows(prepareRows(targetItems));
            setAddedIds(new Set());
            setDeletedIds(new Set());
            setModifiedIds(new Set());
        },
        [prepareRows]
    );

    const [previousItems, setPreviousItems] = useState<TEntity[]>(items);
    if (items !== previousItems) {
        setPreviousItems(items);
        resetGridState(items);
    }

    const handleResetAll = useCallback(() => {
        resetGridState(items);
    }, [items, resetGridState]);

    const handleRowChange = useCallback(
        (id: string, updatedRow: TEntity, _diff?: unknown) => {
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
                const restoredRow = prepareRow ? prepareRow(originalItem) : { ...originalItem };
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
        [addedIds, originalMap, prepareRow]
    );

    const handleAddRow = useCallback(
        (customNewRow?: TEntity) => {
            const newRow = customNewRow ?? createRow?.();
            if (!newRow) {
                return;
            }

            setRows((previousRows) => [newRow, ...previousRows]);
            setAddedIds((previousAddedIds) => new Set(previousAddedIds).add(newRow.id));
        },
        [createRow]
    );

    const handleDuplicateRow = useCallback(
        (sourceRow: TEntity) => {
            const duplicatedRow = cloneRow
                ? cloneRow(sourceRow)
                : {
                    ...sourceRow,
                    id: generateGuid(),
                };

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

    const buildDiff = useCallback((): EditableGridDiff<TEntity> => {
        const addedList = rows.filter((row) => addedIds.has(row.id));
        const updatedList = rows.filter((row) => modifiedIds.has(row.id) && !deletedIds.has(row.id));

        return {
            added: addedList,
            updated: updatedList,
            deletedIds: Array.from(deletedIds),
        };
    }, [rows, addedIds, modifiedIds, deletedIds]);

    const commit = useCallback(
        async (overrideDiff?: EditableGridDiff<TEntity>) => {
            if (!onCommit) {
                return;
            }

            const diffToCommit = overrideDiff ?? buildDiff();
            setIsSaving(true);
            try {
                await onCommit(diffToCommit);
            } finally {
                setIsSaving(false);
            }
        },
        [onCommit, buildDiff]
    );

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
        buildDiff,
        commit,
        handleRowChange,
        handleRowRevert,
        handleAddRow,
        handleDuplicateRow,
        handleDeleteRow,
        handleResetAll,
    };
};
