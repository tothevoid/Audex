import React from 'react';
import {
    Badge,
    Box,
    Button,
    Card,
    Flex,
    HStack,
    Icon,
    Spinner,
    Text,
    VStack
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { MdAdd, MdHistory, MdSchedule } from 'react-icons/md';
import { ScheduledTaskEntity } from '@/models/scheduler/ScheduledTaskEntity';
import { toggleTaskStatus } from '@/api/scheduler/schedulerTaskApi';
import AddButton from '@/shared/components/AddButton/AddButton';
import SwitchInput from '@/shared/components/SwitchInput/SwitchInput';
import { formatCronExpression, getTaskStatusDotColor } from '@/pages/Scheduler/schedulerUtils';

interface SchedulerTaskMasterListProps {
    tasks: ScheduledTaskEntity[];
    selectedTaskName: string | null;
    onSelectTask: (task: ScheduledTaskEntity | null) => void;
    isLoading: boolean;
    onTaskUpdated: () => void;
    onCreateNew: () => void;
}

export const SchedulerTaskMasterList: React.FC<SchedulerTaskMasterListProps> = ({
    tasks,
    selectedTaskName,
    onSelectTask,
    isLoading,
    onTaskUpdated,
    onCreateNew
}) => {
    const { t, i18n } = useTranslation();
    const [togglingMap, setTogglingMap] = React.useState<Record<string, boolean>>({});

    const handleToggle = async (task: ScheduledTaskEntity, nextState: boolean) => {
        setTogglingMap((prev) => ({ ...prev, [task.taskName]: true }));
        try {
            await toggleTaskStatus(task.taskName, nextState);
            onTaskUpdated();
        } finally {
            setTogglingMap((prev) => ({ ...prev, [task.taskName]: false }));
        }
    };

    if (isLoading) {
        return (
            <Flex justify="center" align="center" minH="200px">
                <Spinner size="lg" color="action_primary" />
            </Flex>
        );
    }

    if (tasks.length === 0) {
        return (
            <Card.Root
                p={6}
                textAlign="center"
                backgroundColor="background_secondary"
                borderColor="border_primary"
                borderWidth="1px"
                borderRadius="lg"
            >
                <VStack gap={3}>
                    <Icon fontSize="36px" color="action_primary"><MdSchedule /></Icon>
                    <Text fontWeight="semibold" fontSize="sm" color="text_primary">
                        {t('scheduler_no_tasks_title')}
                    </Text>
                    <Button size="xs" background="action_primary" color="white" onClick={onCreateNew}>
                        <Icon mr={1}><MdAdd /></Icon>
                        {t('scheduler_add_task_button')}
                    </Button>
                </VStack>
            </Card.Root>
        );
    }

    const isAllSelected = selectedTaskName === null;

    return (
        <VStack align="stretch" gap={2.5}>
            <AddButton
                buttonTitle={t('scheduler_add_task_button')}
                onClick={onCreateNew}
            />

            {/* General Journal Entry */}
            <Card.Root
                onClick={() => onSelectTask(null)}
                cursor="pointer"
                backgroundColor={isAllSelected ? 'background_secondary' : 'background_primary'}
                borderColor={isAllSelected ? 'action_primary' : 'border_primary'}
                borderWidth={isAllSelected ? '2px' : '1px'}
                borderRadius="md"
                p={3.5}
                _hover={{
                    borderColor: isAllSelected ? 'action_primary' : 'border_secondary',
                    backgroundColor: 'background_secondary'
                }}
                transition="all 0.15s ease"
            >
                <Flex justify="space-between" align="center">
                    <HStack gap={2.5}>
                        <Icon color={isAllSelected ? 'action_primary' : 'text_secondary'} fontSize="18px">
                            <MdHistory />
                        </Icon>
                        <Text
                            fontWeight={isAllSelected ? 'bold' : 'semibold'}
                            fontSize="sm"
                            color="text_primary"
                        >
                            {t('scheduler_tab_journal')}
                        </Text>
                    </HStack>
                    <Badge size="xs" colorPalette="gray">
                        {tasks.length}
                    </Badge>
                </Flex>
            </Card.Root>

            {tasks.map((task) => {
                const isSelected = task.taskName === selectedTaskName;
                const isToggling = !!togglingMap[task.taskName];
                const statusColor = getTaskStatusDotColor(task.isEnabled, task.lastExecutionStatus);

                return (
                    <Card.Root
                        key={task.taskName}
                        onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('[data-scope="switch"]') || target.closest('[data-switch-container]')) {
                                return;
                            }
                            onSelectTask(task);
                        }}
                        cursor="pointer"
                        backgroundColor={isSelected ? 'background_secondary' : 'background_primary'}
                        borderColor={isSelected ? 'action_primary' : 'border_primary'}
                        borderWidth={isSelected ? '2px' : '1px'}
                        borderRadius="md"
                        p={3.5}
                        _hover={{
                            borderColor: isSelected ? 'action_primary' : 'border_secondary',
                            backgroundColor: 'background_secondary'
                        }}
                        transition="all 0.15s ease"
                    >
                        <Flex justify="space-between" align="flex-start" gap={2}>
                            <HStack gap={2} align="flex-start" flex="1" minW={0}>
                                <Box
                                    mt={1}
                                    w={2.5}
                                    h={2.5}
                                    borderRadius="full"
                                    bg={statusColor}
                                    flexShrink={0}
                                />
                                <VStack align="flex-start" gap={1} flex="1" minW={0}>
                                    <HStack gap={1.5} wrap="wrap">
                                        <Text
                                            fontWeight={isSelected ? 'bold' : 'semibold'}
                                            fontSize="sm"
                                            color="text_primary"
                                            truncate
                                        >
                                            {task.displayName}
                                        </Text>
                                        <Badge size="xs" colorPalette="blue">
                                            {task.category}
                                        </Badge>
                                    </HStack>

                                    <HStack gap={1} color="text_secondary" fontSize="xs">
                                        <Icon fontSize="xs" color="action_primary"><MdSchedule /></Icon>
                                        <Text truncate>
                                            {formatCronExpression(task.cronExpression, i18n, t)}
                                        </Text>
                                    </HStack>

                                    {task.isEnabled && task.nextExecutionUtc ? (
                                        <Text fontSize="2xs" color="text_secondary">
                                            {t('scheduler_next_run')}: {format(task.nextExecutionUtc, 'dd.MM HH:mm')}
                                        </Text>
                                    ) : null}
                                </VStack>
                            </HStack>

                            <Box
                                data-switch-container="true"
                                flexShrink={0}
                                pt={0.5}
                            >
                                <SwitchInput
                                    checked={task.isEnabled}
                                    disabled={isToggling}
                                    onCheckedChange={(checked) => handleToggle(task, checked)}
                                    colorPalette="green"
                                    size="sm"
                                />
                            </Box>
                        </Flex>
                    </Card.Root>
                );
            })}
        </VStack>
    );
};
