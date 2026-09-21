import React, { Fragment } from 'react';
import { SimpleGrid } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Security from '../Security/Security';
import { SecurityEntity } from '../../../../models/securities/SecurityEntity';
import SecurityModal from '../../modals/SecurityModal/SecurityModal';
import { useSecurities } from '../../hooks/useSecurities';
import Placeholder from '../../../../shared/components/Placeholder/Placeholder';
import AddButton from '../../../../shared/components/AddButton/AddButton';
import SectionHeader from '../../../../shared/components/SectionHeader/SectionHeader';
import { ConfirmModal } from '../../../../shared/modals/ConfirmModal/ConfirmModal';
import { ActiveEntityMode } from '../../../../shared/enums/activeEntityMode';
import { useEntityModal } from '../../../../shared/hooks/useEntityModal';

const SecuritiesList: React.FC = () => {
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

    const onDeleteConfirmed = async () => {
        if (!activeEntity) {
            throw new Error("Deleted entity is not set");
        }

        await deleteSecurityEntity(activeEntity);
        onActionEnded();
    };

    return (
        <Fragment>
            {getHeader()}
            <SimpleGrid pb={5} gap={4} templateColumns="repeat(auto-fill, minmax(320px, 1fr))">
                {securities.map((security: SecurityEntity) => (
                    <Security
                        key={security.id}
                        security={security}
                        onEditClicked={onEditClicked}
                        onDeleteClicked={onDeleteClicked}
                    />
                ))}
            </SimpleGrid>
            <ConfirmModal
                onConfirmed={onDeleteConfirmed}
                title={t("security_delete_title")}
                message={t("modals_delete_message")}
                confirmActionName={t("modals_delete_button")}
                ref={confirmModalRef}
            />
            <SecurityModal
                security={activeEntity}
                modalRef={modalRef}
                onSaved={onSecuritySaved}
            />
        </Fragment>
    );
};

export default SecuritiesList;