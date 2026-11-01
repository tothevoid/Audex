import React, { useMemo, useState } from 'react';
import {
    Badge,
    HStack,
    Icon,
    Table,
    Text
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { formatDateTimeWithSeconds } from '@/shared/utilities/formatters/dateFormatter';
import {
    MdAttachFile,
    MdKeyboardArrowDown,
    MdKeyboardArrowUp
} from 'react-icons/md';
import { ScheduledTaskJournalEntity } from '@/models/scheduler/ScheduledTaskJournalEntity';
import { ScheduledTaskTriggerSource } from '@/models/scheduler/ScheduledTaskEntity';
import { formatDuration, getStatusBadgeProps } from '@/pages/Scheduler/schedulerUtils';
import { SchedulerJournalDetailRow } from './SchedulerJournalDetailRow';
import { TableWrapper, TableColumnConfig } from '@/shared/components/TableWrapper';

const DEFAULT_PAGE_SIZE = 15;
const ROW_HEIGHT = '40px';

interface SchedulerJournalTableProps {
    records: ScheduledTaskJournalEntity[];
    isLoading: boolean;
    pageSize?: number;
    hideTaskColumn?: boolean;
}

export const SchedulerJournalTable: React.FC<SchedulerJournalTableProps> = ({
    records,
    isLoading,
    pageSize = DEFAULT_PAGE_SIZE,
    hideTaskColumn = false
}) => {
    const { t, i18n } = useTranslation();
    const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

    const toggleExpand = (recordId: string) => {
        setExpandedMap((previous) => ({ ...previous, [recordId]: !previous[recordId] }));
    };

    const columnSpan = hideTaskColumn ? 4 : 5;

    const columns: TableColumnConfig<ScheduledTaskJournalEntity>[] = useMemo(() => {
        const columnDefinitions: TableColumnConfig<ScheduledTaskJournalEntity>[] = [
            {
                id: 'time',
                header: t('scheduler_journal_time'),
                width: hideTaskColumn ? '30%' : '20%',
                skeletonWidth: '70%',
                render: (record) => (
                    <HStack gap={2} align="center">
                        <Text whiteSpace="nowrap">
                            {formatDateTimeWithSeconds(new Date(record.executedAtUtc), i18n)}
                        </Text>
                        {hideTaskColumn && Boolean(record.attachments && record.attachments.length > 0) && (
                            <Icon color="blue.400" fontSize="16px" flexShrink={0}>
                                <MdAttachFile />
                            </Icon>
                        )}
                        {hideTaskColumn && Boolean(record.errorMessage || record.logMessage || (record.attachments && record.attachments.length > 0)) && (
                            <Icon color="text_secondary" fontSize="16px" flexShrink={0}>
                                {expandedMap[record.id] ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
                            </Icon>
                        )}
                    </HStack>
                )
            }
        ];

        if (!hideTaskColumn) {
            columnDefinitions.push({
                id: 'taskName',
                header: t('scheduler_task_name'),
                width: '30%',
                skeletonWidth: '80%',
                render: (record) => {
                    const hasAttachments = Boolean(record.attachments && record.attachments.length > 0);
                    const isExpandable = Boolean(record.errorMessage || record.logMessage || hasAttachments);
                    const isExpanded = isExpandable && !!expandedMap[record.id];

                    return (
                        <HStack gap={2} align="center">
                            <Text color="text_primary" fontWeight="medium" truncate title={record.displayName}>
                                {record.displayName}
                            </Text>
                            {hasAttachments && (
                                <Icon color="blue.400" fontSize="16px" flexShrink={0}>
                                    <MdAttachFile />
                                </Icon>
                            )}
                            {isExpandable && (
                                <Icon color="text_secondary" fontSize="16px" flexShrink={0}>
                                    {isExpanded ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
                                </Icon>
                            )}
                        </HStack>
                    );
                }
            });
        }

        columnDefinitions.push(
            {
                id: 'source',
                header: t('scheduler_journal_source'),
                width: hideTaskColumn ? '22%' : '16%',
                skeletonWidth: '60%',
                render: (record) => (
                    <Text color="text_secondary" whiteSpace="nowrap">
                        {record.triggerSource === ScheduledTaskTriggerSource.Scheduled
                            ? t('scheduler_journal_source_scheduled')
                            : t('scheduler_journal_source_manual')}
                    </Text>
                )
            },
            {
                id: 'status',
                header: t('scheduler_status'),
                width: hideTaskColumn ? '24%' : '18%',
                skeletonWidth: '70%',
                skeletonBorderRadius: 'full',
                render: (record) => {
                    const badge = getStatusBadgeProps(record.status, t);
                    return (
                        <Badge size="sm" colorPalette={badge.colorPalette} whiteSpace="nowrap">
                            {badge.label}
                        </Badge>
                    );
                }
            },
            {
                id: 'duration',
                header: t('scheduler_duration'),
                width: hideTaskColumn ? '24%' : '16%',
                skeletonWidth: '50%',
                render: (record) => (
                    <Text color="text_secondary" whiteSpace="nowrap">
                        {formatDuration(record.durationMs)}
                    </Text>
                )
            }
        );

        return columnDefinitions;
    }, [hideTaskColumn, expandedMap, t, i18n]);

    return (
        <TableWrapper
            columns={columns}
            isLoading={isLoading}
            rowCount={records.length > 0 ? records.length : pageSize}
            rowHeight={ROW_HEIGHT}
            minWidth="800px"
            isEmpty={records.length === 0}
            emptyText={t('scheduler_journal_empty')}
        >
            {records.map((record) => {
                const hasAttachments = Boolean(record.attachments && record.attachments.length > 0);
                const hasLog = Boolean(record.errorMessage || record.logMessage);
                const isExpandable = hasLog || hasAttachments;
                const isExpanded = isExpandable && !!expandedMap[record.id];

                return (
                    <React.Fragment key={record.id}>
                        <Table.Row
                            height={ROW_HEIGHT}
                            onClick={() => isExpandable && toggleExpand(record.id)}
                            cursor={isExpandable ? 'pointer' : 'default'}
                            _hover={isExpandable ? { backgroundColor: 'background_secondary' } : undefined}
                            backgroundColor={isExpanded ? 'background_secondary' : 'inherit'}
                            transition="background-color 0.15s ease"
                        >
                            {columns.map((column) => (
                                <Table.Cell key={column.id} verticalAlign="middle" whiteSpace="nowrap">
                                    {column.render ? column.render(record, 0) : null}
                                </Table.Cell>
                            ))}
                        </Table.Row>

                        {isExpanded && (
                            <SchedulerJournalDetailRow
                                record={record}
                                columnSpan={columnSpan}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </TableWrapper>
    );
};
