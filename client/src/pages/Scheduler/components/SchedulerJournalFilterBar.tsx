import React, { useMemo } from 'react';
import { Box, Flex, HStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ScheduledTaskEntity } from '@/models/scheduler/ScheduledTaskEntity';
import { getStatusFilterOptions } from '@/pages/Scheduler/schedulerUtils';
import BaseSelect from '@/shared/components/BaseSelect/BaseSelect';
import RefreshButton from '@/shared/components/RefreshButton';

interface FilterOption {
    value: string;
    label: string;
}

interface SchedulerJournalFilterBarProps {
    tasks?: ScheduledTaskEntity[];
    selectedTask?: string;
    selectedStatus?: string;
    isLoading?: boolean;
    hideTaskFilter?: boolean;
    onTaskFilterChange?: (taskName: string) => void;
    onStatusFilterChange?: (status: string) => void;
    onRefresh: () => void;
}

export const SchedulerJournalFilterBar: React.FC<SchedulerJournalFilterBarProps> = ({
    tasks = [],
    selectedTask = 'All',
    selectedStatus = 'All',
    isLoading = false,
    hideTaskFilter = false,
    onTaskFilterChange,
    onStatusFilterChange,
    onRefresh
}) => {
    const { t } = useTranslation();

    const taskOptions: FilterOption[] = useMemo(() => [
        { value: 'All', label: t('scheduler_all_tasks') },
        ...tasks.map((task) => ({ value: task.taskName, label: task.displayName }))
    ], [tasks, t]);

    const statusOptions: FilterOption[] = useMemo(() => getStatusFilterOptions(t), [t]);

    const selectedTaskOption = taskOptions.find((option) => option.value === selectedTask) ?? taskOptions[0];
    const selectedStatusOption = statusOptions.find((option) => option.value === selectedStatus) ?? statusOptions[0];

    return (
        <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
            <HStack gap={3} wrap="wrap">
                {!hideTaskFilter && onTaskFilterChange && (
                    <Box width="220px">
                        <BaseSelect
                            collection={taskOptions}
                            selectedValue={selectedTaskOption}
                            onSelected={(option) => onTaskFilterChange(option.value)}
                            labelSelector={(option) => option.label}
                            valueSelector={(option) => option.value}
                            placeholder={t('scheduler_all_tasks')}
                        />
                    </Box>
                )}

                {onStatusFilterChange && (
                    <Box width="200px">
                        <BaseSelect
                            collection={statusOptions}
                            selectedValue={selectedStatusOption}
                            onSelected={(option) => onStatusFilterChange(option.value)}
                            labelSelector={(option) => option.label}
                            valueSelector={(option) => option.value}
                            placeholder={t('scheduler_all_statuses')}
                        />
                    </Box>
                )}
            </HStack>

            <RefreshButton
                isRefreshing={isLoading}
                title={t('scheduler_refresh')}
                onClick={onRefresh}
            />
        </Flex>
    );
};

export default SchedulerJournalFilterBar;

