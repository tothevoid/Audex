import React, { useState } from 'react';
import { Box, Button, Flex, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { MdAttachFile, MdDownload, MdInsertDriveFile } from 'react-icons/md';
import { ScheduledTaskAttachmentEntity } from '@/models/scheduler/ScheduledTaskAttachmentEntity';
import { downloadAttachmentFile } from '@/api/scheduler/schedulerAttachmentApi';
import { formatFileSize } from '@/shared/utilities/formatters/fileFormatter';

interface SchedulerAttachmentListProps {
    attachments?: ScheduledTaskAttachmentEntity[];
    variant?: 'boxed' | 'plain';
}

export const SchedulerAttachmentList: React.FC<SchedulerAttachmentListProps> = ({
    attachments = [],
    variant = 'boxed'
}) => {
    const { t } = useTranslation();
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const handleDownload = async (att: ScheduledTaskAttachmentEntity, e: React.MouseEvent) => {
        e.stopPropagation();
        setDownloadingId(att.id);
        try {
            const blob = await downloadAttachmentFile(att.id);
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = att.fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            }
        } finally {
            setDownloadingId(null);
        }
    };

    if (!attachments || attachments.length === 0) {
        return null;
    }

    const items = (
        <VStack align="stretch" gap={2}>
            {attachments.map((att) => {
                const isDownloading = downloadingId === att.id;

                return (
                    <Flex
                        key={att.id}
                        justify="space-between"
                        align="center"
                        p={2.5}
                        borderRadius="md"
                        backgroundColor={variant === 'boxed' ? 'background_secondary' : 'background_primary'}
                        borderWidth="1px"
                        borderColor="border_primary"
                    >
                        <HStack gap={2.5} overflow="hidden">
                            <Icon fontSize="20px" color="action_primary" flexShrink={0}>
                                <MdInsertDriveFile />
                            </Icon>
                            <VStack align="flex-start" gap={0} overflow="hidden">
                                <Text fontSize="xs" fontWeight="medium" color="text_primary" truncate>
                                    {att.fileName}
                                </Text>
                                <Text fontSize="2xs" color="text_secondary">
                                    {formatFileSize(att.fileSizeBytes)}
                                </Text>
                            </VStack>
                        </HStack>

                        <Button
                            size="xs"
                            variant="outline"
                            color="text_primary"
                            borderColor="border_primary"
                            _hover={{ backgroundColor: 'background_primary', borderColor: 'text_secondary' }}
                            loading={isDownloading}
                            onClick={(e) => handleDownload(att, e)}
                            flexShrink={0}
                        >
                            <Icon mr={1}><MdDownload /></Icon>
                            {t('scheduler_journal_download')}
                        </Button>
                    </Flex>
                );
            })}
        </VStack>
    );

    if (variant === 'plain') {
        return items;
    }

    return (
        <Box
            p={3.5}
            borderRadius="md"
            backgroundColor="background_primary"
            borderWidth="1px"
            borderColor="border_primary"
        >
            <HStack gap={1.5} mb={2} color="text_primary">
                <Icon color="action_primary"><MdAttachFile /></Icon>
                <Text fontSize="xs" fontWeight="semibold">
                    {t('scheduler_journal_attachments')} ({attachments.length})
                </Text>
            </HStack>
            {items}
        </Box>
    );
};
