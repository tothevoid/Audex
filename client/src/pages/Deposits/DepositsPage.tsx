import React, { useCallback } from "react";
import { DepositEntity } from "@/models/deposits/DepositEntity";
import { Box } from "@chakra-ui/react";
import CardsGrid from "@/shared/components/CardsGrid";
import DepositStats from "./components/DepositStats/DepositStats";
import Deposit from "./components/Deposit/Deposit";
import DepositsRangeSlider from "./components/DepositsRangeSlider/DepositsRangeSlider";
import { useTranslation } from "react-i18next";
import DepositModal from "./modals/DepositModal/DepositModal";
import { useDeposits } from "./hooks/useDeposits";
import Placeholder from "@/shared/components/Placeholder/Placeholder";
import { useEntityModal } from "@/shared/hooks/useEntityModal";
import { useConfirm } from "@/shared/hooks/useConfirm";
import AddButton from "@/shared/components/AddButton/AddButton";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import FilterBlock from "@/shared/components/FilterBlock";
import PageContainer from "@/shared/components/PageContainer/PageContainer";
import { ActiveEntityMode } from "@/shared/enums/activeEntityMode";

const DepositsPage: React.FC = () => {
	const { t } = useTranslation();
	const { confirmDelete } = useConfirm();

	const {
		activeEntity,
		modalRef,
		onAddClicked,
		onEditClicked,
		mode,
		onActionEnded
	} = useEntityModal<DepositEntity>();

	const {
		deposits,
		boundaries,
		filters,
		updateFilters,
		createDepositEntity,
		updateDepositEntity,
		deleteDepositEntity
	} = useDeposits();

	const onDepositSaved = async (deposit: DepositEntity) => {
		if (mode === ActiveEntityMode.Add) {
			await createDepositEntity(deposit);
		} else if (mode === ActiveEntityMode.Edit) {
			await updateDepositEntity(deposit);
		}
		onActionEnded();
	};

	const onDeleteClicked = useCallback(async (deposit: DepositEntity) => {
		const confirmed = await confirmDelete(t("deposit_delete_title"));
		if (!confirmed) {
			return;
		}

		await deleteDepositEntity(deposit);
	}, [confirmDelete, deleteDepositEntity, t]);

	const onCloneClicked = async (deposit: DepositEntity) => {
		await createDepositEntity(deposit);
	};

	return (
		<PageContainer>
			{deposits.length > 0 && filters.selectedMaxMonths ? (
				<Box mb={6}>
					<DepositStats
						onlyActive={filters.onlyActive}
						selectedMinMonths={filters.selectedMinMonths}
						selectedMaxMonths={filters.selectedMaxMonths}
					/>
				</Box>
			) : null}

			{boundaries && (
				<DepositsRangeSlider
					minMonths={boundaries.minMonths}
					maxMonths={boundaries.maxMonths}
					selectedMinMonths={filters.selectedMinMonths}
					selectedMaxMonths={filters.selectedMaxMonths}
					onRangeChange={(selectedMinMonths, selectedMaxMonths) =>
						updateFilters({ selectedMinMonths, selectedMaxMonths })
					}
				/>
			)}

			{deposits.length > 0 ? (
				<>
					<SectionHeader
						title={t("header_deposits")}
						onAdd={onAddClicked}
						addButtonTitle={t("deposits_list_add_button")}
						pt={4}
					/>
					<FilterBlock
						active={filters.onlyActive}
						activeTitle={t("deposits_list_only_active")}
						onActiveChange={(onlyActive) => updateFilters({ onlyActive })}
					/>
				</>
			) : (
				<Box mt={6}>
					<Placeholder text={t("deposits_page_no_deposits")}>
						<AddButton onClick={onAddClicked} buttonTitle={t("deposits_list_add_button")} />
					</Placeholder>
				</Box>
			)}
			<CardsGrid>
				{deposits.map((deposit: DepositEntity) => (
					<Deposit
						key={deposit.id}
						deposit={deposit}
						onEditClicked={onEditClicked}
						onCloneClicked={onCloneClicked}
						onDeleteClicked={onDeleteClicked}
					/>
				))}
			</CardsGrid>
			<DepositModal deposit={activeEntity} modalRef={modalRef} onSaved={onDepositSaved} />
		</PageContainer>
	);
};

export default DepositsPage;