import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Box, Icon, Tabs, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdAssessment, MdBackup } from 'react-icons/md';
import { BaseModalRef } from '../../shared/utilities/modalUtilities';
import BaseModal from '../../shared/modals/BaseModal/BaseModal';
import { ActionsModalReportCard } from './components/ActionsModalReportCard';
import { ActionsModalBackupCard } from './components/ActionsModalBackupCard';
import { ActionsModalRestoreCard } from './components/ActionsModalRestoreCard';

const ActionsModal = forwardRef<BaseModalRef>((_, ref) => {
    const { t } = useTranslation();
    const modalRef = useRef<BaseModalRef>(null);

    useImperativeHandle(ref, () => ({
        openModal: () => {
            modalRef.current?.openModal();
        },
        closeModal: () => {
            modalRef.current?.closeModal();
        }
    }));

    return (
        <BaseModal
            ref={modalRef}
            maxW="720px"
            title={
                <Text fontWeight="bold">{t("actions_modal_title")}</Text>
            }
        >
            <Box minH="420px" maxH="420px" display="flex" flexDirection="column">
                <Tabs.Root lazyMount={true} unmountOnExit={true} defaultValue="reports" variant="enclosed" display="flex" flexDirection="column" flex="1">
                    <Tabs.List background="background_primary">
                        <Tabs.Trigger _selected={{ bg: "action_primary" }} color="text_primary" value="reports">
                            <Icon mr={2}><MdAssessment /></Icon>
                            {t("actions_tab_reports")}
                        </Tabs.Trigger>
                        <Tabs.Trigger _selected={{ bg: "action_primary" }} color="text_primary" value="backup">
                            <Icon mr={2}><MdBackup /></Icon>
                            {t("actions_tab_backup")}
                        </Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="reports" pt={4} flex="1" overflowY="auto">
                        <ActionsModalReportCard />
                    </Tabs.Content>
                    <Tabs.Content value="backup" pt={4} flex="1" overflowY="auto">
                        <VStack align="stretch" gap={4}>
                            <ActionsModalBackupCard />
                            <ActionsModalRestoreCard />
                        </VStack>
                    </Tabs.Content>
                </Tabs.Root>
            </Box>
        </BaseModal>
    );
});

export default ActionsModal;
