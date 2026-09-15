import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Grid, Heading, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ScheduledTaskEntity, ScheduledTaskExecutionStatus } from '../../models/scheduler/ScheduledTaskEntity';
import { ScheduledTaskJournalEntity } from '../../models/scheduler/ScheduledTaskJournalEntity';
import { getScheduledTasks } from '../../api/scheduler/schedulerTaskApi';
import { getJournalPagination, getScheduledTaskJournal } from '../../api/scheduler/schedulerJournalApi';
import { SchedulerTaskMasterList } from './components/SchedulerTaskMasterList';
import { SchedulerTaskDetailPane } from './components/SchedulerTaskDetailPane';
import { SchedulerJournalTable } from './components/SchedulerJournalTable';
import { ScheduleConfigModal, ScheduleConfigModalRef } from './components/ScheduleConfigModal';
import { CreateTaskModal, CreateTaskModalRef } from './components/CreateTaskModal';
import CollectionPagination from '../../shared/components/CollectionPagination/CollectionPagination';
import PageContainer from '../../shared/components/PageContainer/PageContainer';
import { PaginationConfig } from '../../shared/models/PaginationConfig';
import { useSchedulerEvents } from '../../shared/hooks/useSchedulerEvents';

const SchedulerPage: React.FC = () => {
    const { t } = useTranslation();

    const configModalRef = useRef<ScheduleConfigModalRef>(null);
    const createTaskModalRef = useRef<CreateTaskModalRef>(null);

    const [tasks, setTasks] = useState<ScheduledTaskEntity[]>([]);
    const [isTasksLoading, setIsTasksLoading] = useState<boolean>(true);
    const [selectedTaskName, setSelectedTaskName] = useState<string | null>(null);

    const [journal, setJournal] = useState<ScheduledTaskJournalEntity[]>([]);
    const [isJournalLoading, setIsJournalLoading] = useState<boolean>(false);
    const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>('All');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(15);

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

    const loadJournal = useCallback(async (
        page: number = 1,
        recordsQuantity: number = pageSize,
        task: string = selectedTaskFilter,
        status: string = selectedStatusFilter,
        showLoading: boolean = true
    ) => {
        if (showLoading) {
            setIsJournalLoading(true);
        }
        try {
            const data = await getScheduledTaskJournal({
                pageIndex: page,
                recordsQuantity: recordsQuantity,
                taskName: task !== 'All' ? task : undefined,
                status: status !== 'All' ? (Number(status) as ScheduledTaskExecutionStatus) : undefined
            });
            setJournal(data);
        } finally {
            if (showLoading) {
                setIsJournalLoading(false);
            }
        }
    }, [pageSize, selectedTaskFilter, selectedStatusFilter]);

    useEffect(() => {
        loadTasks(true);
    }, [loadTasks]);

    useEffect(() => {
        if (selectedTaskName === null) {
            loadJournal(currentPage, pageSize, selectedTaskFilter, selectedStatusFilter);
        }
    }, [selectedTaskName, currentPage, pageSize, selectedTaskFilter, selectedStatusFilter, loadJournal]);

    const handleTaskUpdated = useCallback((refreshJournal: boolean = false) => {
        loadTasks(false);
        if (refreshJournal && selectedTaskName === null) {
            loadJournal(currentPage, pageSize, selectedTaskFilter, selectedStatusFilter, false);
        }
    }, [loadTasks, selectedTaskName, loadJournal, currentPage, pageSize, selectedTaskFilter, selectedStatusFilter]);

    useSchedulerEvents({
        onTaskStarted: () => {
            loadTasks(false);
        },
        onTaskExecutionRecorded: () => {
            handleTaskUpdated(true);
        }
    });

    const getJournalPaginationConfig = useCallback(async (): Promise<PaginationConfig | void> => {
        const statusEnum = selectedStatusFilter !== 'All' ? (Number(selectedStatusFilter) as ScheduledTaskExecutionStatus) : undefined;
        return await getJournalPagination(selectedTaskFilter, statusEnum);
    }, [selectedTaskFilter, selectedStatusFilter]);

    const handleTaskFilterChange = (task: string) => {
        setSelectedTaskFilter(task);
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (status: string) => {
        setSelectedStatusFilter(status);
        setCurrentPage(1);
    };

    const handlePageChanged = (recordsQuantity: number, page: number) => {
        const actualPage = page === 0 ? 1 : page;
        setPageSize(recordsQuantity);
        setCurrentPage(actualPage);
        loadJournal(actualPage, recordsQuantity, selectedTaskFilter, selectedStatusFilter);
    };

    const selectedTask = selectedTaskName ? tasks.find((t) => t.taskName === selectedTaskName) || null : null;

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
                                    onRefresh={() => loadJournal(currentPage, pageSize, selectedTaskFilter, selectedStatusFilter)}
                                />

                                <CollectionPagination
                                    key={`${selectedTaskFilter}-${selectedStatusFilter}`}
                                    getPaginationConfig={getJournalPaginationConfig}
                                    onPageChanged={handlePageChanged}
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
