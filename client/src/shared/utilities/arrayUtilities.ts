export const insertByPredicate = <T>(array: T[], newElement: T, predicate: (elm: T) => boolean): T[] => {
    const index = array.findIndex(predicate);
    if (index !== -1){
        array.splice(index, 0, {...newElement});
    } else {
        array.push(newElement);
    }
    return array;
};

export const reorderByPredicate = <T>(array: T[], newElement: T, 
    reorderPredicate: (elm: T) => boolean,
    searchPredicate: (elm: T) => boolean): T[] => {
    const filteredArray = array.filter(searchPredicate);
    return insertByPredicate(filteredArray, newElement, reorderPredicate);
};

export const groupByKey = <KeyT, ValueT>(records: ValueT[], keySelector: (value: ValueT) => KeyT) => {
    return records.reduce((accumulator: Map<KeyT, ValueT[]>, currentValue: ValueT) => {
        const key = keySelector(currentValue);
        if (accumulator.has(key)) {
            accumulator.get(key)!.push(currentValue);
        } else {
            accumulator.set(key, [currentValue]);
        }

        return accumulator;
    }, new Map<KeyT, ValueT[]>);
};

export const sumEntities = <T>(records: T[], entitySumSelector: (entity: T) => number) => {
    return records.reduce((accumulator, currentValue) => {
        accumulator += entitySumSelector(currentValue);
        return accumulator;
    }, 0);
};

export const resolveDefaultEntityId = <T extends { id: string }>(
    items: readonly T[] | T[],
    preferredId?: string | null,
    previousId?: string | null,
    fallback = ""
): string => {
    if (preferredId && items.some((item) => item.id === preferredId)) {
        return preferredId;
    }
    if (previousId && items.some((item) => item.id === previousId)) {
        return previousId;
    }
    return items.length > 0 ? items[0].id : fallback;
};