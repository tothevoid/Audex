import React, { Fragment, useCallback } from 'react';
import CardsGrid from '@/shared/components/CardsGrid';
import { useTranslation } from 'react-i18next';
import Security from '@/pages/SecuritiesPage/components/Security/Security';
import { SecurityEntity } from '@/models/securities/SecurityEntity';
import SecurityModal from '@/pages/SecuritiesPage/modals/SecurityModal/SecurityModal';
import { useSecurities } from '@/pages/SecuritiesPage/hooks/useSecurities';
import Placeholder from '@/shared/components/Placeholder/Placeholder';
import AddButton from '@/shared/components/AddButton/AddButton';
import SectionHeader from '@/shared/components/SectionHeader/SectionHeader';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { ActiveEntityMode } from '@/shared/enums/activeEntityMode';
import { useEntityModal } from '@/shared/hooks/useEntityModal';

const SecuritiesList: React.FC = () => {
    const { t } = useTranslation();
    const { confirmDelete } = useConfirm();

    const {
        activeEntity,
        modalRef,
        onAddClicked,
        onEditClicked,
        mode,
        onActionEnded
    } = useEntityModal<SecurityEntity>();

    const {
        securities,
        createSecurityEntity,
        updateSecurityEntity,
        deleteSecurityEntity
    } = useSecurities();

    const getHeader = () => {
        const addButton = (
            <AddButton
                buttonTitle={t("security_page_summary_add")}
                onClick={onAddClicked}
            />
        );

        if (!securities.length) {
            return (
                <Placeholder text={t("security_page_summary_no_securities")}>
                    {addButton}
                </Placeholder>
            );
        }

        return (
            <SectionHeader
                title={t("header_securities")}
                onAdd={onAddClicked}
                addButtonTitle={t("security_page_summary_add")}
            />
        );
    };

    const onSecuritySaved = async (security: SecurityEntity, file: File | null) => {
        let result;
        if (mode === ActiveEntityMode.Add) {
            result = await createSecurityEntity(security, file);
        } else {
            result = await updateSecurityEntity(security, file);
        }

        if (result.isSuccess) {
            onActionEnded();
        }
        return result;
    };

    const onDeleteClicked = useCallback(async (security: SecurityEntity) => {
        const confirmed = await confirmDelete(t("security_delete_title"));
        if (!confirmed) {
            return;
        }

        await deleteSecurityEntity(security);
    }, [confirmDelete, deleteSecurityEntity, t]);

    return (
        <Fragment>
            {getHeader()}
            <CardsGrid>
                {securities.map((security: SecurityEntity) => (
                    <Security
                        key={security.id}
                        security={security}
                        onEditClicked={onEditClicked}
                        onDeleteClicked={onDeleteClicked}
                    />
                ))}
            </CardsGrid>
            <SecurityModal
                security={activeEntity}
                modalRef={modalRef}
                onSaved={onSecuritySaved}
            />
        </Fragment>
    );
};

export default SecuritiesList;