import React, { useCallback, useEffect, useRef, useState } from "react";
import { SimpleGrid, Box } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { DebtEntity } from "../../../../models/debts/DebtEntity";
import { DebtTagEntity } from "../../../../models/debts/DebtTagEntity";
import { useDebts } from "../../hooks/useDebts";
import DebtModal from "../../modals/DebtModal.tsx/DebtModal";
import Debt from "../Debt/Debt";
import { ConfirmModal } from "../../../../shared/modals/ConfirmModal/ConfirmModal";
import { useEntityModal } from "../../../../shared/hooks/useEntityModal";
import { ActiveEntityMode } from "../../../../shared/enums/activeEntityMode";
import { DebtTagAssignModal } from "../../modals/DebtTagAssignModal/DebtTagAssignModal";
import { BaseModalRef } from "../../../../shared/utilities/modalUtilities";
import { assignTagsToDebt } from "../../../../api/debts/debtTagApi";
import DebtsHeader from "../DebtsHeader/DebtsHeader";

interface Props {
    debtsPaymentsVersion: number;
    onDebtsChanged: (debts: number) => void;
    tags: DebtTagEntity[];
    selectedDebtId?: string | null;
    onSelectDebt: (debtId: string | null) => void;
    selectedTagFilter?: string | null;
    onSelectedTagFilterChange?: (tagId: string | null) => void;
    onTagCreatedOrUpdated?: () => Promise<void>;
    onOpenTagManagerModal?: () => void;
    onOpenTagStatsModal?: () => void;
}

const DebtsList: React.FC<Props> = ({
    debtsPaymentsVersion,
    onDebtsChanged,
    tags,
    selectedDebtId,
    onSelectDebt,
    selectedTagFilter: externalTagFilter,
    onSelectedTagFilterChange: externalOnTagFilterChange,
    onTagCreatedOrUpdated,
    onOpenTagManagerModal,
    onOpenTagStatsModal
}) => {
    const { t } = useTranslation();

    const [onlyActive, setOnlyActive] = useState(true);
    const [internalTagFilter, setInternalTagFilter] = useState<string | null>(null);
    const selectedTagFilter = externalTagFilter !== undefined ? externalTagFilter : internalTagFilter;
    const setSelectedTagFilter = externalOnTagFilterChange || setInternalTagFilter;
    const [tagAssignDebt, setTagAssignDebt] = useState<DebtEntity | null>(null);

    const tagAssignModalRef = useRef<BaseModalRef>(null);

    const {
        activeEntity,
        modalRef,
        confirmModalRef,
        onAddClicked,
        onEditClicked,
        onDeleteClicked,
        mode,
        onActionEnded
    } = useEntityModal<DebtEntity>();

    const {
        debts,
        createDebtEntity,
        updateDebtEntity,
        deleteDebtEntity,
        reloadDebts
    } = useDebts();

    const reloadData = useCallback(async () => {
        await reloadDebts();
    }, [reloadDebts]);

    useEffect(() => {
        if (debtsPaymentsVersion >= 0) {
            reloadData();
        }
    }, [debtsPaymentsVersion, reloadData]);

    useEffect(() => {
        onDebtsChanged(debts.length);
    }, [debts, onDebtsChanged]);

    const availableFilterTags = React.useMemo(() => {
        const candidateDebts = onlyActive ? debts.filter((d) => Boolean(d.amount)) : debts;
        return tags.filter((tag) => candidateDebts.some((d) => d.debtTags?.some((dt) => dt.id === tag.id)));
    }, [tags, debts, onlyActive]);

    useEffect(() => {
        if (selectedTagFilter && !availableFilterTags.some((t) => t.id === selectedTagFilter)) {
            setSelectedTagFilter(null);
        }
    }, [availableFilterTags, selectedTagFilter]);

    const filteredDebts = debts.filter((debt) => {
        if (onlyActive && !debt.amount) return false;
        if (selectedTagFilter) {
            return debt.debtTags?.some((tag) => tag.id === selectedTagFilter);
        }
        return true;
    });

    useEffect(() => {
        if (selectedDebtId && !filteredDebts.some((d) => d.id === selectedDebtId)) {
            onSelectDebt(null);
        }
    }, [filteredDebts, selectedDebtId, onSelectDebt]);

    const onDebtSaved = async (debt: DebtEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createDebtEntity(debt);
        } else if (mode === ActiveEntityMode.Edit) {
            await updateDebtEntity(debt);
        }
        if (onTagCreatedOrUpdated) {
            await onTagCreatedOrUpdated();
        }
        onActionEnded();
    };

    const handleManageTagsClicked = (debt: DebtEntity) => {
        setTagAssignDebt(debt);
        tagAssignModalRef.current?.openModal();
    };

    const handleSaveTagsForDebt = async (debtToUpdate: DebtEntity, newTags: DebtTagEntity[]) => {
        await assignTagsToDebt(debtToUpdate.id, newTags.map((t) => t.id));
        await reloadDebts();
        if (onTagCreatedOrUpdated) {
            await onTagCreatedOrUpdated();
        }
    };

    const onDeleteConfirmed = async () => {
        if (!activeEntity) {
            throw new Error("Deleted entity is not set");
        }

        await deleteDebtEntity(activeEntity);
        if (onSelectDebt && selectedDebtId === activeEntity.id) {
            onSelectDebt(null);
        }
        onActionEnded();
    };

    const handleDebtClick = (debt: DebtEntity) => {
        if (onSelectDebt) {
            if (selectedDebtId === debt.id) {
                onSelectDebt(null);
            } else {
                onSelectDebt(debt.id);
            }
        }
    };

    return (
        <Box>
            <DebtsHeader
                hasDebts={debts.length > 0}
                debts={debts}
                tags={availableFilterTags}
                onlyActive={onlyActive}
                onOnlyActiveChange={setOnlyActive}
                selectedTagFilter={selectedTagFilter}
                onSelectedTagFilterChange={setSelectedTagFilter}
                onAddClicked={onAddClicked}
                onOpenTagManagerModal={onOpenTagManagerModal}
                onOpenTagStatsModal={onOpenTagStatsModal}
            />
            <SimpleGrid pb={5} gap={6} templateColumns="repeat(auto-fill, minmax(300px, 4fr))">
                {filteredDebts.map((debt: DebtEntity) => (
                    <Debt
                        key={debt.id}
                        debt={debt}
                        isSelected={selectedDebtId === debt.id}
                        onSelect={handleDebtClick}
                        onEditClicked={onEditClicked}
                        onDeleteClicked={onDeleteClicked}
                        onManageTagsClicked={handleManageTagsClicked}
                    />
                ))}
            </SimpleGrid>
            <ConfirmModal
                onConfirmed={onDeleteConfirmed}
                title={t("debts_delete_title")}
                message={t("modals_delete_message")}
                confirmActionName={t("modals_delete_button")}
                ref={confirmModalRef}
            />
            <DebtModal debt={activeEntity} modalRef={modalRef} onSaved={onDebtSaved} />
            <DebtTagAssignModal
                ref={tagAssignModalRef}
                debt={tagAssignDebt}
                availableTags={tags}
                onSaved={handleSaveTagsForDebt}
                onTagsReloadRequested={onTagCreatedOrUpdated || (async () => { })}
            />
        </Box>
    );
};

export default DebtsList;