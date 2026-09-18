import { Box, Button, Icon, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MdDelete, MdEdit } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { ConfirmModal } from "../../../../shared/modals/ConfirmModal/ConfirmModal";
import { BaseModalRef } from "../../../../shared/utilities/modalUtilities";
import { Nullable } from "../../../../shared/utilities/nullable";
import { createBank, deleteBank, getBankIconUrl, getBanks, updateBank } from "../../../../api/banks/bankApi";
import { BankEntity } from "../../../../models/banks/BankEntity";
import BankModal from "../../modals/BankModal/BankModal";
import { BsBank } from "react-icons/bs";
import AddButton from "../../../../shared/components/AddButton/AddButton";
import DataTable, { ColumnDef } from "../../../../shared/components/DataTable/DataTable";
import StoredIcon from "../../../../shared/components/StoredIcon";

interface State {
    banks: BankEntity[]
}

const BanksTable: React.FC = () => {
    const [state, setState] = useState<State>({
        banks: []});
    const [isLoading, setIsLoading] = useState(true);

    const [bankToDeleteId, setBankToDeleteId] = useState<string | null>(null);
    const [updatedBank, setUpdatedBank] = useState<BankEntity | null>(null);

    const { t } = useTranslation();
    const modalRef = useRef<BaseModalRef>(null);
    const confirmModalRef = useRef<BaseModalRef>(null);

    const fetchBanks = async () => { 
        setIsLoading(true);
        try {
            const banks = await getBanks();
            setState((currentState) => {
                return {...currentState, banks}
            });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchBanks();
    }, []);

    useEffect(() => {
        if (bankToDeleteId) {
            confirmModalRef.current?.openModal();
        }
    }, [bankToDeleteId]);

    useEffect(() => {
        if (updatedBank) {
            modalRef.current?.openModal(); 
        }
    }, [updatedBank]);
    
    const onAdd = () => {
        modalRef.current?.openModal()
    };

    const onEditClicked = (bank: BankEntity) => {
        setUpdatedBank(bank);
    }

    const onModalClosed = () => {
        setUpdatedBank(null);
    }

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

        setState((currentState) => {
            return {...currentState, banks: [...currentState.banks, addedBank]}
        })
    }

    const onBankUpdated = async (bankToUpdate: BankEntity, icon: Nullable<File>) => {
        const updatedBank = await updateBank(bankToUpdate, icon);
        if (!updatedBank) {
            return;
        }

        setState((currentState) => {
            return {...currentState, banks: currentState.banks.map(bank => 
                bankToUpdate.id !== bank.id ?
                    bank:
                    updatedBank
            )}
        })
    }

    const onDeleteClicked = async (bank: BankEntity) => {
        setBankToDeleteId(bank.id)
    }

    const onDeleteConfirmed = async () => {
        if (!bankToDeleteId){
            return;
        }

        const isDeleted = await deleteBank(bankToDeleteId);
        
        if (!isDeleted) {
            return;
        }

        const banks = state.banks.filter((bank: BankEntity) => {
            return bank.id !== bankToDeleteId;
        });

        setState((currentState) => {
            return {...currentState, banks: banks}
        })
        setBankToDeleteId(null);
    }

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
    ], [t, state.banks]);

    return <Box color="text_primary">
        <Box mb={4}>
            <AddButton buttonTitle={t("entity_bank_add")} onClick={onAdd}/>
        </Box>
        <DataTable
            data={state.banks}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            skeletonRows={5}
        />
        <BankModal onModalClosed={onModalClosed} bank={updatedBank} modalRef={modalRef} onSaved={onBankSaved}/>
        <ConfirmModal onConfirmed={onDeleteConfirmed}
            title={t("banks_delete_title")}
            message={t("modals_delete_message")}
            confirmActionName={t("modals_delete_button")}
            ref={confirmModalRef}/>
    </Box>
}

export default BanksTable;