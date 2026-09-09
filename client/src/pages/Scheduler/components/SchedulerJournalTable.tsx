import React, { useMemo, useState } from 'react';
import { Badge, Box, Button, Flex, HStack, Icon, SimpleGrid, Spinner, Table, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
    MdAttachFile,
    MdErrorOutline,
    MdInfoOutline,
    MdKeyboardArrowDown,
    MdKeyboardArrowUp,
    MdRefresh
} from 'react-icons/md';
import { ScheduledTaskJournalEntity } from '../../../models/scheduler/ScheduledTaskJournalEntity';
import { ScheduledTaskEntity, ScheduledTaskTriggerSource } from '../../../models/scheduler/ScheduledTaskEntity';
import { formatDuration, getStatusBadgeProps, getStatusFilterOptions } from '../schedulerUtils';
import BaseSelect from '../../../shared/components/BaseSelect/BaseSelect';
import { SchedulerAttachmentList } from './SchedulerAttachmentList';
import CopyButton from '../../../shared/components/CopyButton/CopyButton';

interface FilterOption {
    value: string;
    label: string;
}

interface SchedulerJournalTableProps {
    records: ScheduledTaskJournalEntity[];
    tasks?: ScheduledTaskEntity[];
    isLoading: boolean;
    selectedTask?: string;
    selectedStatus?: string;
    hideTaskFilter?: boolean;
    hideTaskColumn?: boolean;
    onTaskFilterChange?: (task: string) => void;
    onStatusFilterChange?: (status: string) => void;
    onRefresh: () => void;
}

export const SchedulerJournalTable: React.FC<SchedulerJournalTableProps> = ({
    records,
    tasks = [],
    isLoading,
    selectedTask = 'All',
    selectedStatus = 'All',
    hideTaskFilter = false,
    hideTaskColumn = false,
    onTaskFilterChange,
    onStatusFilterChange,
    onRefresh
}) => {
    const { t } = useTranslation();
    const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const taskOptions: FilterOption[] = useMemo(() => [
        { value: 'All', label: t('scheduler_all_tasks') },
        ...tasks.map((task) => ({ value: task.taskName, label: task.displayName }))
    ], [tasks, t]);

    const statusOptions: FilterOption[] = useMemo(() => getStatusFilterOptions(t), [t]);

    const selectedTaskOption = taskOptions.find((opt) => opt.value === selectedTask) ?? taskOptions[0];
    const selectedStatusOption = statusOptions.find((opt) => opt.value === selectedStatus) ?? statusOptions[0];

    const colSpan = hideTaskColumn ? 5 : 6;

    return (
        <VStack align="stretch" gap={4}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                <HStack gap={3} wrap="wrap">
                    {!hideTaskFilter && onTaskFilterChange && (
                        <Box width="220px">
                            <BaseSelect
                                collection={taskOptions}
                                selectedValue={selectedTaskOption}
                                onSelected={(opt) => onTaskFilterChange(opt.value)}
                                labelSelector={(opt) => opt.label}
                                valueSelector={(opt) => opt.value}
                                placeholder={t('scheduler_all_tasks')}
                            />
                        </Box>
                    )}

                    {onStatusFilterChange && (
                        <Box width="200px">
                            <BaseSelect
                                collection={statusOptions}
                                selectedValue={selectedStatusOption}
                                onSelected={(opt) => onStatusFilterChange(opt.value)}
                                labelSelector={(opt) => opt.label}
                                valueSelector={(opt) => opt.value}
                                placeholder={t('scheduler_all_statuses')}
                            />
                        </Box>
                    )}
                </HStack>

                <Button size="sm" variant="outline" borderColor="border_primary" color="text_primary" onClick={onRefresh}>
                    <Icon mr={1}><MdRefresh /></Icon>
                    {t('scheduler_refresh')}
                </Button>
            </Flex>

            {isLoading ? (
                <Flex justify="center" align="center" minH="200px">
                    <Spinner size="xl" color="action_primary" />
                </Flex>
            ) : records.length === 0 ? (
                <Box p={8} textAlign="center" borderRadius="md" backgroundColor="background_secondary" borderWidth="1px" borderColor="border_primary">
                    <Text color="text_secondary">{t('scheduler_journal_empty')}</Text>
                </Box>
            ) : (
                <Box overflowX="auto" borderRadius="md" borderWidth="1px" borderColor="border_primary">
                    <Table.Root size="sm" variant="outline">
                        <Table.Header backgroundColor="background_secondary">
                            <Table.Row>
                                <Table.ColumnHeader color="text_primary">{t('scheduler_journal_time')}</Table.ColumnHeader>
                                {!hideTaskColumn && (
                                    <Table.ColumnHeader color="text_primary">{t('scheduler_task_name')}</Table.ColumnHeader>
                                )}
                                <Table.ColumnHeader color="text_primary">{t('scheduler_journal_source')}</Table.ColumnHeader>
                                <Table.ColumnHeader color="text_primary">{t('scheduler_status')}</Table.ColumnHeader>
                                <Table.ColumnHeader color="text_primary">{t('scheduler_duration')}</Table.ColumnHeader>
                                <Table.ColumnHeader color="text_primary" textAlign="right"></Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body backgroundColor="background_primary">
                            {records.map((record) => {
                                const hasAttachments = Boolean(record.attachments && record.attachments.length > 0);
                                const hasLog = Boolean(record.errorMessage || record.logMessage);
                                const isExpandable = hasLog || hasAttachments;
                                const isExpanded = isExpandable && !!expandedMap[record.id];

                                return (
                                    <React.Fragment key={record.id}>
                                        <Table.Row
                                            onClick={() => isExpandable && toggleExpand(record.id)}
                                            cursor={isExpandable ? 'pointer' : 'default'}
                                            _hover={isExpandable ? { backgroundColor: 'background_secondary' } : undefined}
                                            backgroundColor={isExpanded ? 'background_secondary' : 'inherit'}
                                            transition="background-color 0.15s ease"
                                        >
                                            <Table.Cell color="text_primary" whiteSpace="nowrap">
                                                {format(new Date(record.executedAtUtc), 'dd.MM.yyyy HH:mm:ss')}
                                            </Table.Cell>
                                            {!hideTaskColumn && (
                                                <Table.Cell color="text_primary" fontWeight="medium">
                                                    {record.displayName}
                                                </Table.Cell>
                                            )}
                                            <Table.Cell color="text_secondary">
                                                {record.triggerSource === ScheduledTaskTriggerSource.Scheduled
                                                    ? t('scheduler_journal_source_scheduled')
                                                    : t('scheduler_journal_source_manual')}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {(() => {
                                                    const badge = getStatusBadgeProps(record.status, t);
                                                    return (
                                                        <Badge size="sm" colorPalette={badge.colorPalette}>
                                                            {badge.label}
                                                        </Badge>
                                                    );
                                                })()}
                                            </Table.Cell>
                                            <Table.Cell color="text_secondary">
                                                {formatDuration(record.durationMs)}
                                            </Table.Cell>
                                            <Table.Cell textAlign="right">
                                                <HStack justify="flex-end" gap={2}>
                                                    {hasAttachments && (
                                                        <Badge size="xs" colorPalette="blue">
                                                            <Icon mr={1}><MdAttachFile /></Icon>
                                                            {record.attachments.length}
                                                        </Badge>
                                                    )}
                                                    {isExpandable && (
                                                        <Icon color="text_secondary" fontSize="18px">
                                                            {isExpanded ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
                                                        </Icon>
                                                    )}
                                                </HStack>
                                            </Table.Cell>
                                        </Table.Row>

                                        {isExpanded && (
                                            <Table.Row backgroundColor="background_secondary">
                                                <Table.Cell colSpan={colSpan} p={4}>
                                                    <SimpleGrid columns={{ base: 1, md: hasLog && hasAttachments ? 2 : 1 }} gap={4}>
                                                        {/* Блок лога / результата */}
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

                                                        {/* Блок прикрепленных файлов */}
                                                        {hasAttachments && (
                                                            <SchedulerAttachmentList attachments={record.attachments} />
                                                        )}
                                                    </SimpleGrid>
                                                </Table.Cell>
                                            </Table.Row>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </Table.Body>
                    </Table.Root>
                </Box>
            )}
        </VStack>
    );
};
