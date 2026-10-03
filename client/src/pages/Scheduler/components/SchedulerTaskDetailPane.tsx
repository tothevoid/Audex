import React, { useCallback, useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Card,
    Flex,
    HStack,
    Icon,
    IconButton,
    Separator,
    SimpleGrid,
    Text,
    VStack
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
    MdDeleteOutline,
    MdPlayArrow,
    MdSchedule,
    MdSettings
} from 'react-icons/md';
import { ScheduledTaskEntity, ScheduledTaskExecutionStatus } from '@/models/scheduler/ScheduledTaskEntity';
import { GetJournalQueryRequest, ScheduledTaskJournalEntity } from '@/models/scheduler/ScheduledTaskJournalEntity';
import { deleteScheduledTask, runTaskNow } from '@/api/scheduler/schedulerTaskApi';
import { getPagedScheduledTaskJournal } from '@/api/scheduler/schedulerJournalApi';
import { formatCronExpression, formatDuration, getStatusBadgeProps } from '@/pages/Scheduler/schedulerUtils';
import { SchedulerJournalTable } from './SchedulerJournalTable';
import { useSchedulerEvents } from '@/shared/hooks/useSchedulerEvents';
import usePagedQuery from '@/shared/hooks/usePagedQuery';
import CollectionPagination from '@/shared/components/CollectionPagination/CollectionPagination';

interface SchedulerTaskDetailPaneProps {
    task: ScheduledTaskEntity | null;
    onConfigure: (task: ScheduledTaskEntity) => void;
    onTaskUpdated: () => void;
}

export const SchedulerTaskDetailPane: React.FC<SchedulerTaskDetailPaneProps> = ({
    task,
    onConfigure,
    onTaskUpdated
}) => {
    const { t, i18n } = useTranslation();
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

    const taskName = task?.taskName;

    const journalFilters = useMemo(() => ({
        taskName: taskName,
        status: selectedStatusFilter !== 'All' ? (Number(selectedStatusFilter) as ScheduledTaskExecutionStatus) : undefined
    }), [taskName, selectedStatusFilter]);

    const {
        items: history,
        totalCount,
        pageIndex: currentPage,
        pageSize,
        isLoading: isLoadingHistory,
        loadPage,
        refreshPage: reloadHistory
    } = usePagedQuery<ScheduledTaskJournalEntity, GetJournalQueryRequest>({
        fetchData: getPagedScheduledTaskJournal,
        filters: journalFilters,
        initialPageSize: 15,
        autoLoad: Boolean(taskName)
    });

    const handleTaskExecutionRecorded = useCallback((payload: { taskName: string }) => {
        if (taskName && payload.taskName === taskName) {
            reloadHistory();
        }
    }, [taskName, reloadHistory]);

    useSchedulerEvents({
        onTaskExecutionRecorded: handleTaskExecutionRecorded
    });

    const handleRunNow = async () => {
        if (!task) return;
        setIsRunning(true);
        try {
            await runTaskNow(task.taskName);
            onTaskUpdated();
            await reloadHistory();
        } finally {
            setIsRunning(false);
        }
    };

    const handleDelete = async () => {
        if (!task) return;
        if (!window.confirm(t('scheduler_delete_confirm', { name: task.displayName }))) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteScheduledTask(task.taskName);
            onTaskUpdated();
        } finally {
            setIsDeleting(false);
        }
    };

    if (!task) {
        return (
            <Card.Root
                p={8}
                textAlign="center"
                backgroundColor="background_secondary"
                borderColor="border_primary"
                borderWidth="1px"
                borderRadius="lg"
                minH="400px"
                display="flex"
                justifyContent="center"
                alignItems="center"
            >
                <VStack gap={3}>
                    <Icon fontSize="48px" color="text_secondary"><MdSchedule /></Icon>
                    <Text color="text_secondary" fontSize="md">
                        {t('scheduler_no_task_selected')}
                    </Text>
                </VStack>
            </Card.Root>
        );
    }

    return (
        <VStack align="stretch" gap={4}>
            {/* Hero Card: Task Title & Actions */}
            <Card.Root
                backgroundColor="background_secondary"
                borderColor="border_primary"
                borderWidth="1px"
                borderRadius="lg"
                p={5}
            >
                <Flex
                    direction={{ base: 'column', md: 'row' }}
                    justify="space-between"
                    align={{ base: 'stretch', md: 'flex-start' }}
                    gap={4}
                >
                    <VStack align="flex-start" gap={1.5} flex="1">
                        <HStack gap={2} wrap="wrap">
                            <Text fontSize="xl" fontWeight="bold" color="text_primary">
                                {task.displayName}
                            </Text>
                            <Badge size="sm" colorPalette="blue">
                                {task.category}
                            </Badge>
                            <Badge size="sm" colorPalette={task.isEnabled ? 'green' : 'gray'}>
                                {task.isEnabled ? t('scheduler_status_active') : t('scheduler_status_paused')}
                            </Badge>
                        </HStack>
                        <Text fontSize="xs" color="text_secondary">
                            {task.description}
                        </Text>
                    </VStack>

                    <HStack gap={2} wrap="wrap">
                        <Button
                            size="sm"
                            colorPalette="green"
                            loading={isRunning}
                            onClick={handleRunNow}
                        >
                            <Icon mr={1}><MdPlayArrow /></Icon>
                            {t('scheduler_run_now')}
                        </Button>

                        <IconButton
                            aria-label={t('scheduler_configure')}
                            title={t('scheduler_configure')}
                            size="sm"
                            variant="outline"
                            borderColor="border_primary"
                            color="text_primary"
                            _hover={{ backgroundColor: 'background_primary' }}
                            onClick={() => onConfigure(task)}
                        >
                            <MdSettings />
                        </IconButton>

                        <IconButton
                            aria-label="Delete"
                            size="sm"
                            variant="outline"
                            borderColor="border_primary"
                            color="red.400"
                            _hover={{ backgroundColor: 'red.950', borderColor: 'red.800' }}
                            loading={isDeleting}
                            onClick={handleDelete}
                            title={t('scheduler_delete_task')}
                        >
                            <MdDeleteOutline />
                        </IconButton>
                    </HStack>
                </Flex>

                <Separator my={4} borderColor="border_primary" />

                {/* Key Task Metrics Grid */}
                <SimpleGrid columns={{ base: 1, sm: 3 }} gap={3}>
                    <Box p={3} borderRadius="md" backgroundColor="background_primary" borderWidth="1px" borderColor="border_primary">
                        <Text fontSize="2xs" color="text_secondary" textTransform="uppercase" fontWeight="bold" mb={1}>
                            {t('scheduler_schedule')}
                        </Text>
                        <Text fontSize="sm" fontWeight="semibold" color="text_primary">
                            {formatCronExpression(task.cronExpression, i18n, t)}
                        </Text>
                        {task.cronExpression && (
                            <Text fontSize="xs" fontFamily="monospace" color="action_primary" mt={0.5}>
                                {task.cronExpression}
                            </Text>
                        )}
                    </Box>

                    <Box p={3} borderRadius="md" backgroundColor="background_primary" borderWidth="1px" borderColor="border_primary">
                        <Text fontSize="2xs" color="text_secondary" textTransform="uppercase" fontWeight="bold" mb={1}>
                            {t('scheduler_last_run')}
                        </Text>
                        {task.lastExecutionUtc ? (
                            <>
                                <Text fontSize="sm" fontWeight="semibold" color="text_primary">
                                    {format(new Date(task.lastExecutionUtc), 'dd.MM.yyyy HH:mm')}
                                </Text>
                                <HStack gap={1} mt={0.5}>
                                    <Badge size="xs" colorPalette={getStatusBadgeProps(task.lastExecutionStatus, t).colorPalette}>
                                        {getStatusBadgeProps(task.lastExecutionStatus, t).label}
                                    </Badge>
                                    {task.lastExecutionDurationMs !== undefined && (
                                        <Text fontSize="2xs" color="text_secondary">
                                            {formatDuration(task.lastExecutionDurationMs)}
                                        </Text>
                                    )}
                                </HStack>
                            </>
                        ) : (
                            <Text fontSize="sm" color="text_secondary">
                                {t('scheduler_never_executed')}
                            </Text>
                        )}
                    </Box>

                    <Box p={3} borderRadius="md" backgroundColor="background_primary" borderWidth="1px" borderColor="border_primary">
                        <Text fontSize="2xs" color="text_secondary" textTransform="uppercase" fontWeight="bold" mb={1}>
                            {t('scheduler_next_run')}
                        </Text>
                        {task.isEnabled && task.nextExecutionUtc ? (
                            <Text fontSize="sm" fontWeight="semibold" color="text_primary">
                                {format(new Date(task.nextExecutionUtc), 'dd.MM.yyyy HH:mm')}
                            </Text>
                        ) : (
                            <Text fontSize="sm" color="text_secondary">
                                —
                            </Text>
                        )}
                    </Box>
                </SimpleGrid>
            </Card.Root>

            {/* Reused Journal Table filtered for this specific task */}
            <SchedulerJournalTable
                records={history}
                isLoading={isLoadingHistory}
                selectedStatus={selectedStatusFilter}
                hideTaskFilter
                hideTaskColumn
                onStatusFilterChange={setSelectedStatusFilter}
                onRefresh={reloadHistory}
            />

            <CollectionPagination
                count={totalCount}
                page={currentPage}
                pageSize={pageSize}
                onPageChange={loadPage}
            />
        </VStack>
    );
};
