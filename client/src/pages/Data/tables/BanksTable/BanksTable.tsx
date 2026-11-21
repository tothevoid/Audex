import { Box, Button, Icon, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MdDelete, MdEdit } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import { Nullable } from "@/shared/utilities/nullable";
import { createBank, deleteBank, getBankIconUrl, getBanks, updateBank } from "@/api/banks/bankApi";
import { BankEntity } from "@/models/banks/BankEntity";
import BankModal from "@/pages/Data/modals/BankModal/BankModal";
import { BsBank } from "react-icons/bs";
import SectionHeader from "@/shared/components/SectionHeader/SectionHeader";
import DataTable, { ColumnDef } from "@/shared/components/DataTable/DataTable";
import StoredIcon from "@/shared/components/StoredIcon";
import { notify } from "@/shared/components/Toaster";

interface State {
    banks: BankEntity[]
}

const BanksTable: React.FC = () => {
    const [state, setState] = useState<State>({
        banks: []});
    const [isLoading, setIsLoading] = useState(true);

    const [updatedBank, setUpdatedBank] = useState<BankEntity | null>(null);

    const { t } = useTranslation();
    const { confirmDelete } = useConfirm();
    const modalRef = useRef<BaseModalRef>(null);


    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const banks = await getBanks();
                if (isMounted) {
                    setState((currentState) => ({ ...currentState, banks }));
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (updatedBank) {
            modalRef.current?.openModal(); 
        }
    }, [updatedBank]);
    
    const onAdd = () => {
        modalRef.current?.openModal();
    };

    const onEditClicked = (bank: BankEntity) => {
        setUpdatedBank(bank);
    };

    const onModalClosed = () => {
        setUpdatedBank(null);
    };

    const onBankSaved = async (savedBank: BankEntity, icon: Nullable<File>) => {
        const isModified = state.banks
            .findIndex(bank => bank.id === savedBank.id) >= 0;

        if (isModified) {
            await onBankUpdated(savedBank, icon);
        } else {
            await onBankAdded(savedBank, icon);
        }
    };

    const onBankAdded = async (bank: BankEntity, icon: Nullable<File>) => {
        const addedBank = await createBank(bank, icon);
        if (!addedBank) {
            return;
        }

        notify.success(t("bank_toast_created_title"), t("bank_toast_created_desc", { name: addedBank.name }));

        setState((currentState) => {
            return {...currentState, banks: [...currentState.banks, addedBank]};
        });
    };

    const onBankUpdated = async (bankToUpdate: BankEntity, icon: Nullable<File>) => {
        const updatedBank = await updateBank(bankToUpdate, icon);
        if (!updatedBank) {
            return;
        }

        notify.success(t("bank_toast_updated_title"), t("bank_toast_updated_desc", { name: updatedBank.name }));

        setState((currentState) => {
            return {...currentState, banks: currentState.banks.map(bank => 
                bankToUpdate.id !== bank.id ?
                    bank:
                    updatedBank
            )};
        });
    };

    const onDeleteClicked = async (bank: BankEntity) => {
        const confirmed = await confirmDelete(t("banks_delete_title"));
        if (!confirmed) {
            return;
        }

        const isDeleted = await deleteBank(bank.id);
        if (!isDeleted) {
            return;
        }

        notify.success(t("bank_toast_deleted_title"), t("bank_toast_deleted_desc", { name: bank.name }));

        setState((currentState) => ({
            ...currentState,
            banks: currentState.banks.filter((item: BankEntity) => item.id !== bank.id),
        }));
    };

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
                        <MdEdit/>
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
                        <MdDelete/>
                    </Icon>
                </Button>
            )
        }
    ], [t]);

    return <Box color="text_primary">
        <SectionHeader
            title={t("data_tab_banks")}
            onAdd={onAdd}
            addButtonTitle={t("entity_bank_add")}
        />
        <DataTable
            data={state.banks}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            skeletonRows={5}
        />
        <BankModal onModalClosed={onModalClosed} bank={updatedBank} modalRef={modalRef} onSaved={onBankSaved}/>
    </Box>;
};

export default BanksTable;