import React, { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useBrokerAccountTaxDeductions } from '../../hooks/useBrokerAccountTaxDeductions';
import { ConfirmModal } from '../../../../shared/modals/ConfirmModal/ConfirmModal';
import { useEntityModal } from '../../../../shared/hooks/useEntityModal';
import { useTranslation } from 'react-i18next';
import { Nullable } from '../../../../shared/utilities/nullable';
import SectionHeader from '../../../../shared/components/SectionHeader';
import { ActiveEntityMode } from '../../../../shared/enums/activeEntityMode';
import BrokerAccountTaxDeduction from '../BrokerAccountTaxDeduction/BrokerAccountTaxDeduction';
import { BrokerAccountTaxDeductionEntity } from '../../../../models/brokers/BrokerAccountTaxDeductionEntity';
import BrokerAccountTaxDeductionModal, { CreateBrokerAccountTaxDeductionContext, EditBrokerAccountTaxDeductionContext } from '../../../BrokerAccounts/modals/BrokerAccountTaxDeductionModal/BrokerAccountTaxDeductionModal';

interface Props {
    brokerAccountId: Nullable<string>,
    onDataChanged?: () => void
}

const BrokerAccountTaxDeductionsList: React.FC<Props> = (props) => {
    const {
        taxDeductions,
        createTaxDeductionEntity,
        updateTaxDeductionEntity,
        deleteTaxDeductionEntity,
    } = useBrokerAccountTaxDeductions({ brokerAccountId: props.brokerAccountId }, props.onDataChanged);

    const { 
        modalRef,
        activeEntity,
        confirmModalRef,
        onDeleteClicked,
        onAddClicked,
        onEditClicked,
        onActionEnded,
        mode,
    } = useEntityModal<BrokerAccountTaxDeductionEntity>();

    const onDeleteConfirmed = async () => {
        if (!activeEntity) {
            throw new Error("Deleted entity is not set")
        }

        await deleteTaxDeductionEntity(activeEntity);
        onActionEnded();
    }

    const [context, setContext] = useState<Nullable<CreateBrokerAccountTaxDeductionContext | EditBrokerAccountTaxDeductionContext>>(null);

    const onTaxDeductionSaved = async (deduction: BrokerAccountTaxDeductionEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createTaxDeductionEntity(deduction);
        } else if (mode === ActiveEntityMode.Edit) {
            await updateTaxDeductionEntity(deduction);
        }

        onActionEnded();
    };

    useEffect(() => {
        const context = activeEntity ?
            { taxDeduction: activeEntity } as EditBrokerAccountTaxDeductionContext:
            { brokerAccountId: props.brokerAccountId } as CreateBrokerAccountTaxDeductionContext;
        setContext(context);
    }, [props.brokerAccountId, activeEntity]);

    const {t} = useTranslation();
    const isGlobalBrokerAccount = !props.brokerAccountId;

    return <Box>
        <SectionHeader
            title={t("broker_account_page_deduction_taxes_tab")}
            size="lg"
            onAdd={onAddClicked}
            addButtonTitle={t("broker_account_tax_deduction_modal_deduction_button")}
            my={4}
        />
        <Box>
        {
            taxDeductions.map((taxDeduction: BrokerAccountTaxDeductionEntity) => 
                <BrokerAccountTaxDeduction key={taxDeduction.id}
                    isGlobalBrokerAccount={isGlobalBrokerAccount}
                    onEditClicked={onEditClicked}
                    onDeleteClicked={onDeleteClicked}
                    taxDeduction={taxDeduction}
                />)
        }
        </Box>
        <ConfirmModal onConfirmed={onDeleteConfirmed}
            title={t("entity_broker_account_tax_deduction_delete_title")}
            message={t("modals_delete_message")}
            confirmActionName={t("modals_delete_button")}
            ref={confirmModalRef}/>
        {context && <BrokerAccountTaxDeductionModal isGlobalBrokerAccount={isGlobalBrokerAccount} modalRef={modalRef} context={context} onSaved={onTaxDeductionSaved}  />}
    </Box>
}

export default BrokerAccountTaxDeductionsList;