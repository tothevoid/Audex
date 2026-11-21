import React, { useCallback, useMemo } from 'react';
import { Box } from '@chakra-ui/react';
import { useBrokerAccountTaxDeductions } from '@/pages/BrokerAccount/hooks/useBrokerAccountTaxDeductions';
import { useEntityModal } from '@/shared/hooks/useEntityModal';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { useTranslation } from 'react-i18next';
import { Nullable } from '@/shared/utilities/nullable';
import SectionHeader from '@/shared/components/SectionHeader';
import { ActiveEntityMode } from '@/shared/enums/activeEntityMode';
import BrokerAccountTaxDeduction from '@/pages/BrokerAccount/components/BrokerAccountTaxDeduction/BrokerAccountTaxDeduction';
import { BrokerAccountTaxDeductionEntity } from '@/models/brokers/BrokerAccountTaxDeductionEntity';
import BrokerAccountTaxDeductionModal, { CreateBrokerAccountTaxDeductionContext, EditBrokerAccountTaxDeductionContext } from '@/pages/BrokerAccounts/modals/BrokerAccountTaxDeductionModal/BrokerAccountTaxDeductionModal';

interface Props {
    brokerAccountId: Nullable<string>,
    onDataChanged: () => void
}

const BrokerAccountTaxDeductionsList: React.FC<Props> = ({ brokerAccountId, onDataChanged }) => {
    const {
        taxDeductions,
        createTaxDeductionEntity,
        updateTaxDeductionEntity,
        deleteTaxDeductionEntity,
    } = useBrokerAccountTaxDeductions({ brokerAccountId });

    const { t } = useTranslation();
    const { confirmDelete } = useConfirm();

    const {
        modalRef,
        activeEntity,
        onAddClicked,
        onEditClicked,
        onActionEnded,
        mode,
    } = useEntityModal<BrokerAccountTaxDeductionEntity>();

    const onDeleteClicked = useCallback(async (deduction: BrokerAccountTaxDeductionEntity) => {
        const confirmed = await confirmDelete(t("entity_broker_account_tax_deduction_delete_title"));
        if (!confirmed) {
            return;
        }

        await deleteTaxDeductionEntity(deduction);
        onDataChanged();
    }, [confirmDelete, deleteTaxDeductionEntity, onDataChanged, t]);

    const onTaxDeductionSaved = async (deduction: BrokerAccountTaxDeductionEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createTaxDeductionEntity(deduction);
        } else if (mode === ActiveEntityMode.Edit) {
            await updateTaxDeductionEntity(deduction);
        }

        onActionEnded();
        onDataChanged();
    };

    const context = useMemo<CreateBrokerAccountTaxDeductionContext | EditBrokerAccountTaxDeductionContext>(() => {
        if (activeEntity) {
            return { taxDeduction: activeEntity };
        }
        return { brokerAccountId };
    }, [brokerAccountId, activeEntity]);

    const isGlobalBrokerAccount = !brokerAccountId;

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
        {context && <BrokerAccountTaxDeductionModal isGlobalBrokerAccount={isGlobalBrokerAccount} modalRef={modalRef} context={context} onSaved={onTaxDeductionSaved} />}
    </Box>;
};

export default BrokerAccountTaxDeductionsList;