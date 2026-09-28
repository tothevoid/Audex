import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Grid, Heading, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ScheduledTaskEntity, ScheduledTaskExecutionStatus } from '../../models/scheduler/ScheduledTaskEntity';
import { ScheduledTaskJournalEntity, GetJournalQueryRequest } from '../../models/scheduler/ScheduledTaskJournalEntity';
import { getScheduledTasks } from '../../api/scheduler/schedulerTaskApi';
import { getPagedScheduledTaskJournal } from '../../api/scheduler/schedulerJournalApi';
import { SchedulerTaskMasterList } from './components/SchedulerTaskMasterList';
import { SchedulerTaskDetailPane } from './components/SchedulerTaskDetailPane';
import { SchedulerJournalTable } from './components/SchedulerJournalTable';
import { ScheduleConfigModal, ScheduleConfigModalRef } from './components/ScheduleConfigModal';
import { CreateTaskModal, CreateTaskModalRef } from './components/CreateTaskModal';
import CollectionPagination from '../../shared/components/CollectionPagination/CollectionPagination';
import PageContainer from '../../shared/components/PageContainer/PageContainer';
import { useSchedulerEvents } from '../../shared/hooks/useSchedulerEvents';
import usePagedQuery from '../../shared/hooks/usePagedQuery';

const SchedulerPage: React.FC = () => {
    const { t } = useTranslation();

    const configModalRef = useRef<ScheduleConfigModalRef>(null);
    const createTaskModalRef = useRef<CreateTaskModalRef>(null);

    const [tasks, setTasks] = useState<ScheduledTaskEntity[]>([]);
    const [isTasksLoading, setIsTasksLoading] = useState<boolean>(true);
    const [selectedTaskName, setSelectedTaskName] = useState<string | null>(null);

    const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('All');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

    const journalFilters = useMemo(() => ({
        taskName: selectedTaskFilter !== 'All' ? selectedTaskFilter : undefined,
        status: selectedStatusFilter !== 'All' ? (Number(selectedStatusFilter) as ScheduledTaskExecutionStatus) : undefined
    }), [selectedTaskFilter, selectedStatusFilter]);

    const {
        items: journal,
        totalCount,
        pageIndex: currentPage,
        pageSize,
        isLoading: isJournalLoading,
        loadPage,
        refreshPage: reloadJournal
    } = usePagedQuery<ScheduledTaskJournalEntity, GetJournalQueryRequest>({
        fetchData: getPagedScheduledTaskJournal,
        filters: journalFilters,
        initialPageSize: 15,
        autoLoad: selectedTaskName === null,
        keySelector: (entry) => entry.id
    });

    const loadTasks = useCallback(async (showLoading: boolean = false) => {
        if (showLoading) {
            setIsTasksLoading(true);
        }
        try {
            const data = await getScheduledTasks();
            setTasks(data);
        } finally {
            if (showLoading) {
                setIsTasksLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadTasks(true);
    }, [loadTasks]);

    const handleTaskUpdated = useCallback((refreshJournal: boolean = false) => {
        loadTasks(false);
        if (refreshJournal && selectedTaskName === null) {
            reloadJournal();
        }
    }, [loadTasks, selectedTaskName, reloadJournal]);

    useSchedulerEvents({
        onTaskStarted: () => {
            loadTasks(false);
        },
        onTaskExecutionRecorded: () => {
            handleTaskUpdated(true);
        }
    });

    const handleTaskFilterChange = (task: string) => {
        setSelectedTaskFilter(task);
    };

    const handleStatusFilterChange = (status: string) => {
        setSelectedStatusFilter(status);
    };

    const selectedTask = selectedTaskName ? tasks.find((task) => task.taskName === selectedTaskName) || null : null;

    return (
        <PageContainer>
            <VStack align="stretch" gap={5}>
                {/* Header with Title */}
                <Heading size="lg" color="text_primary">
                    {t('scheduler_page_title')}
                </Heading>

                {/* Master-Detail Workspace */}
                <Grid templateColumns={{ base: '1fr', lg: '340px 1fr', xl: '380px 1fr' }} gap={5} alignItems="start">
                    <Box>
                        <SchedulerTaskMasterList
                            tasks={tasks}
                            selectedTaskName={selectedTaskName}
                            onSelectTask={(task) => setSelectedTaskName(task?.taskName ?? null)}
                            isLoading={isTasksLoading}
                            onTaskUpdated={handleTaskUpdated}
                            onCreateNew={() => createTaskModalRef.current?.openModal()}
                        />
                    </Box>

                    <Box minW={0}>
                        {selectedTask ? (
                            <SchedulerTaskDetailPane
                                task={selectedTask}
                                onConfigure={(task) => configModalRef.current?.openModal(task)}
                                onTaskUpdated={handleTaskUpdated}
                            />
                        ) : (
                            <VStack align="stretch" gap={5}>
                                <SchedulerJournalTable
                                    records={journal}
                                    tasks={tasks}
                                    isLoading={isJournalLoading}
                                    selectedTask={selectedTaskFilter}
                                    selectedStatus={selectedStatusFilter}
                                    onTaskFilterChange={handleTaskFilterChange}
                                    onStatusFilterChange={handleStatusFilterChange}
                                    onRefresh={reloadJournal}
                                />

                                <CollectionPagination
                                    count={totalCount}
                                    page={currentPage}
                                    pageSize={pageSize}
                                    onPageChange={loadPage}
                                />
                            </VStack>
                        )}
                    </Box>
                </Grid>

                {/* Modals */}
                <ScheduleConfigModal
                    ref={configModalRef}
                    onSaved={() => handleTaskUpdated(false)}
                />

                <CreateTaskModal
                    ref={createTaskModalRef}
                    onCreated={() => handleTaskUpdated(false)}
                />
            </VStack>
        </PageContainer>
    );
};

export default SchedulerPage;
