import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Button, HStack, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import BaseModal from '../../../../../shared/modals/BaseModal/BaseModal';
import { BaseModalRef } from '../../../../../shared/utilities/modalUtilities';
import { formatDate } from '../../../../../shared/utilities/formatters/dateFormatter';
import { CommitDiffPayload, OutOfMonthItem } from '../types';

export const hasOutOfPeriodTransactions = (
    diff: CommitDiffPayload,
    month?: number,
    year?: number
): boolean => {
    if (!month || !year) return false;
    return [...diff.added, ...diff.updated].some((item) => {
        const d = new Date(item.date);
        return d.getMonth() + 1 !== month || d.getFullYear() !== year;
    });
};

interface OutOfMonthWarningModalProps {
    diff: CommitDiffPayload | null;
    selectedMonth?: number;
    selectedYear?: number;
    isSaving: boolean;
    onConfirm: () => void;
}

export const OutOfMonthWarningModal = forwardRef<BaseModalRef, OutOfMonthWarningModalProps>(({
    diff,
    selectedMonth,
    selectedYear,
    isSaving,
    onConfirm,
}, ref) => {
    const { t, i18n } = useTranslation();
    const modalRef = useRef<BaseModalRef>(null);

    useImperativeHandle(ref, () => ({
        openModal: () => modalRef.current?.openModal(),
        closeModal: () => modalRef.current?.closeModal(),
    }));

    const items = useMemo(() => {
        if (!diff || !selectedMonth || !selectedYear) return [];

        const outOfPeriod: OutOfMonthItem[] = [];
        [...diff.added, ...diff.updated].forEach((item) => {
            const itemDate = new Date(item.date);
            const itemMonth = itemDate.getMonth() + 1;
            const itemYear = itemDate.getFullYear();
            if (itemMonth !== selectedMonth || itemYear !== selectedYear) {
                const displayName = item.name || item.transactionType?.name || item.account?.name || '—';
                outOfPeriod.push({
                    name: displayName,
                    dateStr: formatDate(itemDate, i18n, false),
                });
            }
        });

        return outOfPeriod;
    }, [diff, selectedMonth, selectedYear, i18n]);

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
                        onClick={onConfirm}
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
                {items.map((item, idx) => (
                    <HStack key={idx} justify="space-between" fontSize="xs">
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

OutOfMonthWarningModal.displayName = 'OutOfMonthWarningModal';
