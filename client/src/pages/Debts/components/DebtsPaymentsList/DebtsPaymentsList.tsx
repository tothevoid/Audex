import { Fragment, useCallback, useEffect } from "react";
import { Box, Flex, Badge, Button } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { DebtPaymentEntity } from "../../../../models/debts/DebtPaymentEntity";
import { useDebtPayments } from "../../hooks/useDebtPayments";
import DebtPaymentModal from "../../modals/DebtPaymentModal/DebtPaymentModal";
import DebtPayment from "../DebtPayment/DebtPayment";
import { useEntityModal } from "../../../../shared/hooks/useEntityModal";
import { ConfirmModal } from "../../../../shared/modals/ConfirmModal/ConfirmModal";
import { ActiveEntityMode } from "../../../../shared/enums/activeEntityMode";
import AddButton from "../../../../shared/components/AddButton/AddButton";
import SectionHeader from "../../../../shared/components/SectionHeader";
import CollectionPagination from "../../../../shared/components/CollectionPagination/CollectionPagination";
import PlaceholderWrapper from "../../../../shared/components/Placeholder/PlaceholderWrapper";
import { getDebtPaymentsPagination } from "../../../../api/debts/debtPaymentApi";
import { MdClose } from "react-icons/md";

interface Props {
    onDebtPaymentsChanged: () => void;
    selectedDebtId?: string | null;
    selectedDebtName?: string | null;
    selectedTagId?: string | null;
    onClearDebtFilter?: () => void;
}

const DebtsPaymentsList: React.FC<Props> = ({
    onDebtPaymentsChanged,
    selectedDebtId,
    selectedDebtName,
    selectedTagId,
    onClearDebtFilter
}) => {
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
    } = useEntityModal<DebtPaymentEntity>();

    const {
        debtPayments,
        createDebtPaymentEntity,
        updateDebtPaymentEntity,
        deleteDebtPaymentEntity,
        setDebtPaymentsQueryParameters
    } = useDebtPayments({ pageIndex: 1, recordsQuantity: -1, debtId: selectedDebtId || undefined, tagId: selectedTagId || undefined });

    useEffect(() => {
        setDebtPaymentsQueryParameters((prev) => ({
            ...prev,
            pageIndex: 1,
            debtId: selectedDebtId || undefined,
            tagId: selectedTagId || undefined
        }));
    }, [selectedDebtId, selectedTagId, setDebtPaymentsQueryParameters]);

    const onDebtPaymentSaved = async (createdDebtPayment: DebtPaymentEntity) => {
        if (mode === ActiveEntityMode.Add) {
            await createDebtPaymentEntity(createdDebtPayment);
        } else if (mode === ActiveEntityMode.Edit) {
            await updateDebtPaymentEntity(createdDebtPayment);
        }
        onDebtPaymentsChanged();
        onActionEnded();
    };

    const onDeleteConfirmed = async () => {
		if (!activeEntity) {
            throw new Error("Deleted entity is not set");
        }

        await deleteDebtPaymentEntity(activeEntity);
        onDebtPaymentsChanged();
		onActionEnded();
    };

    const getPagination = useCallback(() => {
        return getDebtPaymentsPagination(selectedDebtId || undefined, selectedTagId || undefined);
    }, [selectedDebtId, selectedTagId]);

    const onPageChanged = async (recordsQuantity: number, pageIndex: number) => {
		setDebtPaymentsQueryParameters({ recordsQuantity, pageIndex, debtId: selectedDebtId || undefined, tagId: selectedTagId || undefined });
	};

    return (
        <Fragment>
            <SectionHeader
                title={t("debt_payments_header_title")}
                size="lg"
                onAdd={onAddClicked}
                addButtonTitle={t("debts_page_add_payment")}
                my={4}
                extra={selectedDebtName && (
                    <Flex alignItems="center" gap={1.5} ml={1}>
                        <Badge colorPalette="blue" px={2.5} py={0.5} borderRadius="full" fontSize="xs">
                            {t("debts_payments_filter_debt", { name: selectedDebtName })}
                        </Badge>
                        {onClearDebtFilter && (
                            <Button size="xs" variant="ghost" onClick={onClearDebtFilter} color="text_secondary" px={1.5} h="22px">
                                <MdClose /> {t("debts_payments_filter_clear")}
                            </Button>
                        )}
                    </Flex>
                )}
            />

            <PlaceholderWrapper
                hasData={debtPayments.length > 0}
                text={t("debt_payments_empty")}
                action={<AddButton buttonTitle={t("debts_page_add_payment")} onClick={onAddClicked} />}
            >
                <Box
                    bg="background_primary"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="border_primary"
                    boxShadow="sm"
                    overflow="hidden"
                    mb={4}
                >
                    {debtPayments.map((payment: DebtPaymentEntity, index: number) => (
                        <DebtPayment
                            key={payment.id}
                            debtPayment={payment}
                            isLast={index === debtPayments.length - 1}
                            onEditClicked={onEditClicked}
                            onDeleteClicked={onDeleteClicked}
                        />
                    ))}
                </Box>
            </PlaceholderWrapper>

            <CollectionPagination key={`${selectedDebtId || "all"}-${selectedTagId || "all"}`} getPaginationConfig={getPagination} onPageChanged={onPageChanged} />

            <ConfirmModal
                onConfirmed={onDeleteConfirmed}
                title={t("debt_payment_modal_title")}
                message={t("modals_delete_message")}
                confirmActionName={t("modals_delete_button")}
                ref={confirmModalRef}
            />
            <DebtPaymentModal
                debtPayment={activeEntity}
                selectedDebtId={selectedDebtId}
                modalRef={modalRef}
                onSaved={onDebtPaymentSaved}
            />
        </Fragment>
    );
};

export default DebtsPaymentsList;