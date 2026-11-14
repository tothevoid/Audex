import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Button, HStack, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import BaseModal from '@/shared/modals/BaseModal/BaseModal';
import { BaseModalRef } from '@/shared/utilities/modalUtilities';
import { OutOfPeriodItem } from '@/pages/Transactions/components/TransactionTableGrid/types';

interface OutOfPeriodWarningModalProps {
    items: OutOfPeriodItem[];
    isSaving: boolean;
    onConfirm: () => void;
}

export const OutOfPeriodWarningModal = forwardRef<BaseModalRef, OutOfPeriodWarningModalProps>(({
    items,
    isSaving,
    onConfirm,
}, ref) => {
    const { t } = useTranslation();
    const modalRef = useRef<BaseModalRef>(null);

    useImperativeHandle(ref, () => ({
        openModal: () => modalRef.current?.openModal(),
        closeModal: () => modalRef.current?.closeModal(),
    }));

    const handleConfirm = () => {
        onConfirm();
        modalRef.current?.closeModal();
    };

    return (
        <BaseModal
            ref={modalRef}
            title={t('table_date_warning_title')}
            maxW="520px"
            footer={
                <HStack gap={3}>
                    <Button
                        colorPalette="yellow"
                        loading={isSaving}
                        onClick={handleConfirm}
                    >
                        {t('table_date_warning_confirm')}
                    </Button>
                    <Button variant="outline" onClick={() => modalRef.current?.closeModal()}>
                        {t('modals_cancel_button')}
                    </Button>
                </HStack>
            }
        >
            <Text mb={3} fontSize="sm">
                {t('table_date_warning_message')}
            </Text>
            <VStack
                align="stretch"
                gap={1.5}
                p={3}
                borderRadius="lg"
                bg="background_secondary"
                borderLeftWidth="3px"
                borderColor="status_warning"
            >
                {items.map((item, index) => (
                    <HStack key={index} justify="space-between" fontSize="xs">
                        <Text fontWeight={600} color="text_primary">
                            • {item.name}
                        </Text>
                        <Text color="text_secondary">
                            {item.dateStr}
                        </Text>
                    </HStack>
                ))}
            </VStack>
        </BaseModal>
    );
});

OutOfPeriodWarningModal.displayName = 'OutOfPeriodWarningModal';

