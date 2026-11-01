import React from 'react';
import {
    Box,
    Flex,
    HStack,
    Icon,
    SimpleGrid,
    Table,
    Text
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdErrorOutline, MdInfoOutline } from 'react-icons/md';
import { ScheduledTaskJournalEntity } from '@/models/scheduler/ScheduledTaskJournalEntity';
import { SchedulerAttachmentList } from './SchedulerAttachmentList';
import CopyButton from '@/shared/components/CopyButton/CopyButton';

interface SchedulerJournalDetailRowProps {
    record: ScheduledTaskJournalEntity;
    columnSpan: number;
}

export const SchedulerJournalDetailRow: React.FC<SchedulerJournalDetailRowProps> = ({
    record,
    columnSpan
}) => {
    const { t } = useTranslation();

    const hasLog = Boolean(record.errorMessage || record.logMessage);
    const hasAttachments = Boolean(record.attachments && record.attachments.length > 0);

    return (
        <Table.Row backgroundColor="background_secondary">
            <Table.Cell colSpan={columnSpan} p={4}>
                <SimpleGrid columns={{ base: 1, md: hasLog && hasAttachments ? 2 : 1 }} gap={4}>
                    {hasLog && (
                        <Box
                            p={3.5}
                            borderRadius="md"
                            backgroundColor="background_primary"
                            borderWidth="1px"
                            borderColor="border_primary"
                        >
                            <Flex justify="space-between" align="center" mb={2}>
                                <HStack gap={1.5} color="text_primary">
                                    <Icon color={record.errorMessage ? 'red.400' : 'blue.400'}>
                                        {record.errorMessage ? <MdErrorOutline /> : <MdInfoOutline />}
                                    </Icon>
                                    <Text fontSize="xs" fontWeight="semibold">
                                        {t('scheduler_journal_log')}
                                    </Text>
                                </HStack>
                                <CopyButton
                                    text={record.errorMessage || record.logMessage || ''}
                                    size="2xs"
                                    color={record.errorMessage ? 'red.200' : 'text_secondary'}
                                />
                            </Flex>

                            {record.errorMessage ? (
                                <Box
                                    p={2.5}
                                    borderRadius="md"
                                    backgroundColor="red.950"
                                    borderColor="red.800"
                                    borderWidth="1px"
                                >
                                    <Text fontSize="xs" color="red.200" fontFamily="mono">
                                        {record.errorMessage}
                                    </Text>
                                </Box>
                            ) : (
                                <Text fontSize="xs" color="text_secondary">
                                    {record.logMessage}
                                </Text>
                            )}
                        </Box>
                    )}

                    {hasAttachments && (
                        <SchedulerAttachmentList attachments={record.attachments} />
                    )}
                </SimpleGrid>
            </Table.Cell>
        </Table.Row>
    );
};

export default SchedulerJournalDetailRow;

