import React, { useState } from "react";
import { DepositEntity } from "../../models/deposits/DepositEntity";
import { Flex, SimpleGrid, Checkbox, Box} from "@chakra-ui/react";
import DepositStats from "./components/DepositStats/DepositStats";
import Deposit from "./components/Deposit/Deposit";
import DepositsRangeSlider from "./components/DepositsRangeSlider/DepositsRangeSlider";
import { useTranslation } from "react-i18next";
import DepositModal from "./modals/DepositModal/DepositModal";
import { useDeposits } from "./hooks/useDeposits";
import Placeholder from "../../shared/components/Placeholder/Placeholder";
import { useEntityModal } from "../../shared/hooks/useEntityModal";
import { ConfirmModal } from "../../shared/modals/ConfirmModal/ConfirmModal";
import AddButton from "../../shared/components/AddButton/AddButton";
import PageContainer from "../../shared/components/PageContainer/PageContainer";
import { ActiveEntityMode } from "../../shared/enums/activeEntityMode";

const DepositsPage: React.FC = () => {
	const { t } = useTranslation();
	const [rangeRefreshKey, setRangeRefreshKey] = useState<number>(0);

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
		createDepositEntity,
		updateDepositEntity,
		deleteDepositEntity,
		depositsQueryParameters, 
		setDepositsQueryParameters
	} = useDeposits({selectedMinMonths: 0, selectedMaxMonths: 0, onlyActive: true});

	const getAddButton = () => {
		return <AddButton onClick={onAddClicked} buttonTitle={t("deposits_list_add_button")} />
	}

	const getAddButtonWithDeposits = () => {
		return getAddButton();
	}

	const getAddButtonWithoutDeposits = () => {
		return <Placeholder text={t("deposits_page_no_deposits")}>
			{getAddButton()}
		</Placeholder>
	}

	const onDepositsRangeChanged = async (fromMonths: number, toMonths: number) => {
		setDepositsQueryParameters(prev => ({
			...prev,
			selectedMinMonths: fromMonths,
			selectedMaxMonths: toMonths,
		}));
	}

	const onCheckboxChanged = async (checked: boolean) => {
		setDepositsQueryParameters(prev => ({
			...prev,
			onlyActive: checked,
		}));
	}

	const { selectedMinMonths, selectedMaxMonths, onlyActive } = depositsQueryParameters;

	const onDepositSaved = async (deposit: DepositEntity) => {
		if (mode === ActiveEntityMode.Add) {
			await createDepositEntity(deposit);
		} else if (mode === ActiveEntityMode.Edit) {
			await updateDepositEntity(deposit);
		}
		setRangeRefreshKey(k => k + 1);
		onActionEnded();
	}

	const onDeleteConfirmed = async () => {
		if (!activeEntity) {
            throw new Error("Deleted entity is not set")
        }

        await deleteDepositEntity(activeEntity);
		setRangeRefreshKey(k => k + 1);
		onActionEnded();
    }

	const onCloneClicked = async (deposit: DepositEntity) => {
        await createDepositEntity(deposit);
		setRangeRefreshKey(k => k + 1);
    }

	return (
		<PageContainer>
			{deposits.length > 0 && selectedMaxMonths ? (
				<Box mb={6}>
					<DepositStats onlyActive={onlyActive} selectedMinMonths={selectedMinMonths} selectedMaxMonths={selectedMaxMonths}/>
				</Box>
			) : null}

			<DepositsRangeSlider onDepositsRangeChanged={onDepositsRangeChanged} refreshTrigger={rangeRefreshKey} />

			{deposits.length > 0 ? (
				<Flex gap={4} direction="row" alignItems="center" pt={4}>
					{getAddButtonWithDeposits()}
					<Checkbox.Root checked={onlyActive} onCheckedChange={(details) => onCheckboxChanged(!!details.checked)} variant="solid">
						<Checkbox.HiddenInput />
						<Checkbox.Control />
						<Checkbox.Label color="text_primary">{t("deposits_list_only_active")}</Checkbox.Label>
					</Checkbox.Root>
				</Flex>
			) : (
				<Box mt={6}>
					{getAddButtonWithoutDeposits()}
				</Box>
			)}
			<SimpleGrid pt={5} pb={5} gap={6} templateColumns='repeat(auto-fill, minmax(300px, 4fr))'>
				{
					deposits.map((deposit: DepositEntity) => 
						<Deposit key={deposit.id} deposit={deposit} 
							onEditClicked={onEditClicked} 
							onCloneClicked={onCloneClicked} 
							onDeleteClicked={onDeleteClicked}/>
					)
				}
			</SimpleGrid>
			<ConfirmModal onConfirmed={onDeleteConfirmed}
				title={t("deposit_delete_title")}
				message={t("modals_delete_message")}
				confirmActionName={t("modals_delete_button")}
				ref={confirmModalRef}/>
			<DepositModal deposit={activeEntity} modalRef={modalRef} onSaved={onDepositSaved}/>
		</PageContainer>
	);
};

export default DepositsPage;