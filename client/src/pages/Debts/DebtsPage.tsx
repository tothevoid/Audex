import React, { useCallback, useEffect, useRef, useState } from "react";
import PageContainer from "../../shared/components/PageContainer/PageContainer";
import DebtsList from "./components/DebtsList/DebtsList";
import DebtsPaymentsList from "./components/DebtsPaymentsList/DebtsPaymentsList";
import { DebtTagManagerModal } from "./modals/DebtTagManagerModal/DebtTagManagerModal";
import { DebtTagStatsModal } from "./modals/DebtTagStatsModal/DebtTagStatsModal";
import { DebtTagEntity, DebtTagStatsEntity } from "../../models/debts/DebtTagEntity";
import { getDebtTags, getDebtTagStats } from "../../api/debts/debtTagApi";
import { getDebts } from "../../api/debts/debtApi";
import { BaseModalRef } from "../../shared/utilities/modalUtilities";

const DebtsPage: React.FC = () => {
	const [hasDebts, setHasDebts] = useState(false);
	const [version, setVersion] = useState(-1);

	const [tags, setTags] = useState<DebtTagEntity[]>([]);
	const [tagStats, setTagStats] = useState<DebtTagStatsEntity[]>([]);
	
	const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
	const [selectedDebtName, setSelectedDebtName] = useState<string | null>(null);
	const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

	const tagManagerModalRef = useRef<BaseModalRef>(null);
	const tagStatsModalRef = useRef<BaseModalRef>(null);

	const loadTagData = useCallback(async () => {
		const [tagsData, statsData] = await Promise.all([
			getDebtTags(),
			getDebtTagStats()
		]);
		setTags(tagsData);
		setTagStats(statsData);
	}, []);

	useEffect(() => {
		loadTagData();
	}, [loadTagData]);

	const handleTagCreatedOrUpdated = useCallback(async () => {
		await loadTagData();
		setVersion((prev) => prev + 1);
	}, [loadTagData]);

	const onDebtsChanged = (quantity: number) => {
		const nowHasDebts = quantity > 0;
		if (nowHasDebts !== hasDebts) {
			setHasDebts(nowHasDebts);
		}
	};

	const onDebtPaymentsChanged = () => {
		setVersion((prev) => prev + 1);
		loadTagData();
	};

	const handleSelectDebt = async (debtId: string | null) => {
		setSelectedDebtId(debtId);
		if (!debtId) {
			setSelectedDebtName(null);
			return;
		}
		const allDebts = await getDebts(false);
		const found = allDebts.find((d) => d.id === debtId);
		setSelectedDebtName(found ? found.name : null);
	};

	return (
		<PageContainer>
			<DebtsList
				debtsPaymentsVersion={version}
				onDebtsChanged={onDebtsChanged}
				tags={tags}
				selectedDebtId={selectedDebtId}
				onSelectDebt={handleSelectDebt}
				selectedTagFilter={selectedTagFilter}
				onSelectedTagFilterChange={setSelectedTagFilter}
				onTagCreatedOrUpdated={handleTagCreatedOrUpdated}
				onOpenTagManagerModal={() => tagManagerModalRef.current?.openModal()}
				onOpenTagStatsModal={() => tagStatsModalRef.current?.openModal()}
			/>

			{hasDebts && (
				<DebtsPaymentsList
					onDebtPaymentsChanged={onDebtPaymentsChanged}
					selectedDebtId={selectedDebtId}
					selectedDebtName={selectedDebtName}
					selectedTagId={selectedTagFilter}
					onClearDebtFilter={() => handleSelectDebt(null)}
				/>
			)}

			<DebtTagManagerModal ref={tagManagerModalRef} tags={tags} onTagsChanged={handleTagCreatedOrUpdated} />
			<DebtTagStatsModal ref={tagStatsModalRef} stats={tagStats} />
		</PageContainer>
	);
};

export default DebtsPage;