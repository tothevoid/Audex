import { Box, Button, Icon, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdDelete, MdEdit } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { Nullable } from "@/shared/utilities/nullable";
import { getBankIconUrl } from "@/api/banks/bankApi";
import { BankEntity } from "@/models/banks/BankEntity";
import BankModal from "@/pages/Data/modals/BankModal/BankModal";
import { BsBank } from "react-icons/bs";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import DataTable, { ColumnDef } from "@/shared/components/DataTable/DataTable";
import StoredIcon from "@/shared/components/StoredIcon";
import { notify } from "@/shared/components/Toaster";
import {
    useBanks,
    useCreateBankMutation,
    useDeleteBankMutation,
    useUpdateBankMutation,
} from "@/shared/hooks/queries/useBanks";

const BanksTable: React.FC = () => {
    const { data: banks = [], isLoading } = useBanks();
    const createBankMutation = useCreateBankMutation();
    const updateBankMutation = useUpdateBankMutation();
    const deleteBankMutation = useDeleteBankMutation();

    const [updatedBank, setUpdatedBank] = useState<BankEntity | null>(null);

    const { t } = useTranslation();
    const { confirmDelete } = useConfirm();
    const modalRef = useRef<BaseModalRef>(null);

    useEffect(() => {
        if (updatedBank) {
            modalRef.current?.openModal();
        }
    }, [updatedBank]);

    const onAdd = () => {
        modalRef.current?.openModal();
    };

    const onEditClicked = useCallback((bank: BankEntity) => {
        setUpdatedBank(bank);
    }, []);

    const onModalClosed = () => {
        setUpdatedBank(null);
    };

    const onBankSaved = async (savedBank: BankEntity, icon: Nullable<File>) => {
        const isModified = banks.some((bank) => bank.id === savedBank.id);

        if (isModified) {
            await onBankUpdated(savedBank, icon);
        } else {
            await onBankAdded(savedBank, icon);
        }
    };

    const onBankAdded = async (bank: BankEntity, icon: Nullable<File>) => {
        const addedBank = await createBankMutation.mutateAsync({ bank, icon });
        if (!addedBank) {
            return;
        }

        notify.success(t("bank_toast_created_title"), t("bank_toast_created_desc", { name: addedBank.name }));
    };

    const onBankUpdated = async (bankToUpdate: BankEntity, icon: Nullable<File>) => {
        const updatedResult = await updateBankMutation.mutateAsync({ bank: bankToUpdate, icon });
        if (!updatedResult) {
            return;
        }

        notify.success(t("bank_toast_updated_title"), t("bank_toast_updated_desc", { name: updatedResult.name }));
    };

    const onDeleteClicked = useCallback(async (bank: BankEntity) => {
        const confirmed = await confirmDelete(t("banks_delete_title"));
        if (!confirmed) {
            return;
        }

        const isDeleted = await deleteBankMutation.mutateAsync(bank.id);
        if (!isDeleted) {
            return;
        }

        notify.success(t("bank_toast_deleted_title"), t("bank_toast_deleted_desc", { name: bank.name }));
    }, [confirmDelete, deleteBankMutation, t]);

    const columns: ColumnDef<BankEntity>[] = useMemo(() => [
        {
            width: "50px",
            render: (bank) => (
                <StoredIcon
                    src={bank.iconKey ? getBankIconUrl(bank.iconKey) : undefined}
                    fallbackIcon={<BsBank size={20} color="var(--chakra-colors-text_secondary)" />}
                    size="md"
                />
            )
        },
        {
            header: t("entity_bank_name"),
            render: (bank) => <Text>{bank.name}</Text>
        },
        {
            width: 10,
            render: (bank) => (
                <Button
                    borderColor="background_secondary"
                    background="button_background_secondary"
                    size={'sm'}
                    onClick={() => onEditClicked(bank)}
                >
                    <Icon color="card_action_icon_primary">
                        <MdEdit />
                    </Icon>
                </Button>
            )
        },
        {
            width: 10,
            render: (bank) => (
                <Button
                    borderColor="background_secondary"
                    background="button_background_secondary"
                    size={'sm'}
                    onClick={() => onDeleteClicked(bank)}
                >
                    <Icon color="card_action_icon_danger">
                        <MdDelete />
                    </Icon>
                </Button>
            )
        }
    ], [onDeleteClicked, onEditClicked, t]);

    return <Box color="text_primary">
        <SectionHeader
            title={t("data_tab_banks")}
            onAdd={onAdd}
            addButtonTitle={t("entity_bank_add")}
        />
        <DataTable
            data={banks}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            skeletonRows={5}
        />
        <BankModal onModalClosed={onModalClosed} bank={updatedBank} modalRef={modalRef} onSaved={onBankSaved} />
    </Box>;
};

export default BanksTable;
