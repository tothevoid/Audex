import React, { Fragment, useCallback, useMemo } from 'react';
import Dividend from '@/pages/SecurityPage/components/Dividend/Dividend';
import { useTranslation } from 'react-i18next';
import { DividendEntity } from '@/models/securities/DividendEntity';
import DividendModal, { CreateDividendContext, EditDividendContext } from '@/pages/SecurityPage/modals/DividendModal/DividendModal';
import { useDividends } from '@/pages/SecurityPage/hooks/useDividends';
import { useEntityModal } from '@/shared/hooks/useEntityModal';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { ActiveEntityMode } from '@/shared/enums/activeEntityMode';
import SectionHeader from '@/shared/components/SectionHeader';
import { Nullable } from '@/shared/utilities/nullable';
import PaginatedList from '@/shared/components/PaginatedList/PaginatedList';
import AddButton from '@/shared/components/AddButton/AddButton';

interface Props {
	securityId: string;
	currencyName?: string;
}

const DividendList: React.FC<Props> = (props) => {
	const { t } = useTranslation();
	const { confirmDelete } = useConfirm();

	const {
		activeEntity,
		modalRef,
		onAddClicked,
		onEditClicked,
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

	const context: Nullable<CreateDividendContext | EditDividendContext> = useMemo(() => {
		return activeEntity
			? ({ dividend: activeEntity } as EditDividendContext)
			: ({ securityId: props.securityId } as CreateDividendContext);
	}, [activeEntity, props.securityId]);

	const onDividendSaved = async (dividend: DividendEntity) => {
		if (mode === ActiveEntityMode.Add) {
			await createDividendEntity(dividend);
		} else {
			await updateDividendEntity(dividend);
		}

		onActionEnded();
	};

	const onDeleteClicked = useCallback(async (dividend: DividendEntity) => {
		const confirmed = await confirmDelete(t("entity_dividend_delete_title"));
		if (!confirmed) {
			return;
		}

		await deleteDividendEntity(dividend);
	}, [confirmDelete, deleteDividendEntity, t]);

	return (
		<Fragment>
			<SectionHeader
				title={t("security_page_tabs_dividends")}
				size="lg"
				onAdd={onAddClicked}
				addButtonTitle={t("security_page_add_dividend_button")}
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
				emptyAction={<AddButton buttonTitle={t("security_page_add_dividend_button")} onClick={onAddClicked} />}
				itemGap={0}
				keySelector={(dividend) => dividend.id}
				renderItem={(dividend) => (
					<Dividend
						dividend={dividend}
						onEditClicked={onEditClicked}
						onDeleteClicked={onDeleteClicked}
					/>
				)}
			/>
			{context && <DividendModal context={context} currencyName={props.currencyName} modalRef={modalRef} onSaved={onDividendSaved} />}
		</Fragment>
	);
};

export default DividendList;