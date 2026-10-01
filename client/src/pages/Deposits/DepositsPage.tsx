import React from "react";
import { DepositEntity } from "@/models/deposits/DepositEntity";
import { SimpleGrid, Box } from "@chakra-ui/react";
import DepositStats from "./components/DepositStats/DepositStats";
import Deposit from "./components/Deposit/Deposit";
import DepositsRangeSlider from "./components/DepositsRangeSlider/DepositsRangeSlider";
import { useTranslation } from "react-i18next";
import DepositModal from "./modals/DepositModal/DepositModal";
import { useDeposits } from "./hooks/useDeposits";
import Placeholder from "@/shared/components/Placeholder/Placeholder";
import { useEntityModal } from "@/shared/hooks/useEntityModal";
import { ConfirmModal } from "@/shared/modals/ConfirmModal/ConfirmModal";
import AddButton from "@/shared/components/AddButton/AddButton";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import FilterBlock from "@/shared/components/FilterBlock";
import PageContainer from "@/shared/components/PageContainer/PageContainer";
import { ActiveEntityMode } from "@/shared/enums/activeEntityMode";

const DepositsPage: React.FC = () => {
	const { t } = useTranslation();

	const { 
		activeEntity,
		modalRef,
		confirmModalRef,
		onAddClicked,
		onEditClicked,
		onDeleteClicked,
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

	const onDeleteConfirmed = async () => {
		if (!activeEntity) {
			throw new Error("Deleted entity is not set");
		}

		await deleteDepositEntity(activeEntity);
		onActionEnded();
	};

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
			<SimpleGrid pb={5} gap={6} templateColumns="repeat(auto-fill, minmax(300px, 4fr))">
				{deposits.map((deposit: DepositEntity) => (
					<Deposit
						key={deposit.id}
						deposit={deposit}
						onEditClicked={onEditClicked}
						onCloneClicked={onCloneClicked}
						onDeleteClicked={onDeleteClicked}
					/>
				))}
			</SimpleGrid>
			<ConfirmModal
				onConfirmed={onDeleteConfirmed}
				title={t("deposit_delete_title")}
				message={t("modals_delete_message")}
				confirmActionName={t("modals_delete_button")}
				ref={confirmModalRef}
			/>
			<DepositModal deposit={activeEntity} modalRef={modalRef} onSaved={onDepositSaved} />
		</PageContainer>
	);
};

export default DepositsPage;