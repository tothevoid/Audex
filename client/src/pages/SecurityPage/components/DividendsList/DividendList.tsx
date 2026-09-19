import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import Dividend from '../Dividend/Dividend';
import { useTranslation } from 'react-i18next';
import { DividendEntity } from '../../../../models/securities/DividendEntity';
import DividendModal, { CreateDividendContext, EditDividendContext } from '../../modals/DividendModal/DividendModal';
import { useDividends } from '../../hooks/useDividends';
import { ConfirmModal } from '../../../../shared/modals/ConfirmModal/ConfirmModal';
import { useEntityModal } from '../../../../shared/hooks/useEntityModal';
import { ActiveEntityMode } from '../../../../shared/enums/activeEntityMode';
import SectionHeader from '../../../../shared/components/SectionHeader';
import { Nullable } from '../../../../shared/utilities/nullable';
import CollectionPagination from '../../../../shared/components/CollectionPagination/CollectionPagination';
import { getDividendsPagination } from '../../../../api/securities/dividendApi';

interface Props {
	securityId: string,
	currencyName?: string
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
		createDividendEntity,
		updateDividendEntity,
		deleteDividendEntity,
		dividendsQueryParameters,
		setDividendsQueryParameters
	} = useDividends({ pageIndex: 1, recordsQuantity: -1, securityId: props.securityId });

	const { t } = useTranslation();
	const [context, setContext] = useState<Nullable<CreateDividendContext | EditDividendContext>>(null);

	useEffect(() => {
		const context = activeEntity ?
			{ dividend: activeEntity } as EditDividendContext:
			{ securityId: props.securityId } as CreateDividendContext

		setContext(context);
	}, [activeEntity, props.securityId ]);

	const onDividendSaved = async (dividend: DividendEntity) => {
		if (mode === ActiveEntityMode.Add) {
			await createDividendEntity(dividend);
		} else {
			await updateDividendEntity(dividend);
		}

		onActionEnded();
	}

	const onDeleteConfirmed = async () => {
		if (!activeEntity) {
			throw new Error("Deleted entity is not set")
		}

		await deleteDividendEntity(activeEntity);
		onActionEnded();
	}

	const getPagination = useCallback(() => {
		return getDividendsPagination(props.securityId);
	}, [props.securityId]);

	const onPageChanged = async (recordsQuantity: number, pageIndex: number) => {
		setDividendsQueryParameters({recordsQuantity, pageIndex, securityId: dividendsQueryParameters.securityId});
	}

	return (
		<Fragment>
			<SectionHeader
				title={t("security_page_tabs_dividends")}
				size="lg"
				onAdd={onAddClicked}
				addButtonTitle={t("security_page_summary_add")}
				my={4}
			/>
			<Box>
				{
					dividends.map((security: DividendEntity) => 
						<Dividend key={security.id} dividend={security} 
							onEditClicked={onEditClicked} 
							onDeleteClicked={onDeleteClicked}/>)
				}
			</Box>
			<CollectionPagination getPaginationConfig={getPagination} onPageChanged={onPageChanged}/>
			<ConfirmModal onConfirmed={onDeleteConfirmed}
				title={t("transaction_delete_title")}
				message={t("modals_delete_message")}
				confirmActionName={t("modals_delete_button")}
				ref={confirmModalRef}/>
			{context && <DividendModal context={context} currencyName={props.currencyName} modalRef={modalRef} onSaved={onDividendSaved}/>}
		</Fragment>
	);
}

export default DividendList;