import React, { Fragment, useEffect, useState } from 'react';
import Dividend from '@/pages/SecurityPage/components/Dividend/Dividend';
import { useTranslation } from 'react-i18next';
import { DividendEntity } from '@/models/securities/DividendEntity';
import DividendModal, { CreateDividendContext, EditDividendContext } from '@/pages/SecurityPage/modals/DividendModal/DividendModal';
import { useDividends } from '@/pages/SecurityPage/hooks/useDividends';
import { ConfirmModal } from '@/shared/modals/ConfirmModal/ConfirmModal';
import { useEntityModal } from '@/shared/hooks/useEntityModal';
import { ActiveEntityMode } from '@/shared/enums/activeEntityMode';
import SectionHeader from '@/shared/components/SectionHeader';
import { Nullable } from '@/shared/utilities/nullable';
import PaginatedList from '@/shared/components/PaginatedList/PaginatedList';

interface Props {
	securityId: string;
	currencyName?: string;
}

const DividendList: React.FC<Props> = (props) => {
	const { 
		activeEntity,
		modalRef,
		confirmModalRef,
		onAddClicked,
		onEditClicked,
		onDeleteClicked,
		mode,
		onActionEnded
	} = useEntityModal<DividendEntity>();

	const {
		dividends,
		totalCount,
		pageIndex,
		pageSize,
		isDividendsLoading,
		loadPage,
		createDividendEntity,
		updateDividendEntity,
		deleteDividendEntity
	} = useDividends({ securityId: props.securityId, initialPageSize: 10 });

	const { t } = useTranslation();
	const [context, setContext] = useState<Nullable<CreateDividendContext | EditDividendContext>>(null);

	useEffect(() => {
		const nextContext = activeEntity ?
			{ dividend: activeEntity } as EditDividendContext :
			{ securityId: props.securityId } as CreateDividendContext;

		setContext(nextContext);
	}, [activeEntity, props.securityId]);

	const onDividendSaved = async (dividend: DividendEntity) => {
		if (mode === ActiveEntityMode.Add) {
			await createDividendEntity(dividend);
		} else {
			await updateDividendEntity(dividend);
		}

		onActionEnded();
	};

	const onDeleteConfirmed = async () => {
		if (!activeEntity) {
			throw new Error("Deleted entity is not set");
		}

		await deleteDividendEntity(activeEntity);
		onActionEnded();
	};

	return (
		<Fragment>
			<SectionHeader
				title={t("security_page_tabs_dividends")}
				size="lg"
				onAdd={onAddClicked}
				addButtonTitle={t("security_page_summary_add")}
				my={4}
			/>
			<PaginatedList
				query={{
					items: dividends,
					isLoading: isDividendsLoading,
					totalCount,
					pageIndex,
					pageSize,
					loadPage
				}}
				emptyText={t("dividends_empty")}
				keySelector={(dividend) => dividend.id}
				renderItem={(dividend) => (
					<Dividend
						dividend={dividend}
						onEditClicked={onEditClicked}
						onDeleteClicked={onDeleteClicked}
					/>
				)}
			/>
			<ConfirmModal
				onConfirmed={onDeleteConfirmed}
				title={t("transaction_delete_title")}
				message={t("modals_delete_message")}
				confirmActionName={t("modals_delete_button")}
				ref={confirmModalRef}
			/>
			{context && <DividendModal context={context} currencyName={props.currencyName} modalRef={modalRef} onSaved={onDividendSaved} />}
		</Fragment>
	);
};

export default DividendList;