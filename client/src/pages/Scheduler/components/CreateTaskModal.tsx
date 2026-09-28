import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Badge, Box, Field, HStack, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { BaseModalRef } from '@/shared/utilities/modalUtilities';
import BaseFormModal from '@/shared/modals/BaseFormModal/BaseFormModal';
import BaseSelect from '@/shared/components/BaseSelect/BaseSelect';
import { ScheduledTaskEntity } from '@/models/scheduler/ScheduledTaskEntity';
import { ScheduledTaskDefinitionEntity } from '@/models/scheduler/ScheduledTaskDefinitionEntity';
import { createScheduledTask, getNotScheduledTasks } from '@/api/scheduler/schedulerTaskApi';
import {
    buildCronSchedule,
    CronScheduleConfig,
    DEFAULT_CRON_SCHEDULE,
    parseCronSchedule
} from '@/pages/Scheduler/schedulerUtils';
import { CronScheduleEditor } from './CronScheduleEditor';
import ButtonGroup from '@/shared/components/ButtonGroup/ButtonGroup';

export interface CreateTaskModalRef {
    openModal: () => void;
    closeModal: () => void;
}

interface CreateTaskModalProps {
    onCreated?: (task: ScheduledTaskEntity) => void;
}

export const CreateTaskModal = forwardRef<CreateTaskModalRef, CreateTaskModalProps>(({ onCreated }, ref) => {
    const { t } = useTranslation();
    const formModalRef = useRef<BaseModalRef>(null);

    const [definitions, setDefinitions] = useState<ScheduledTaskDefinitionEntity[]>([]);
    const [selectedTaskName, setSelectedTaskName] = useState<string>('');
    const [isEnabled, setIsEnabled] = useState<boolean>(true);
    const [scheduleConfig, setScheduleConfig] = useState<CronScheduleConfig>(DEFAULT_CRON_SCHEDULE);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const selectedDefinition = definitions.find((d) => d.taskName === selectedTaskName);

    useImperativeHandle(ref, () => ({
        openModal: async () => {
            setErrorMessage(null);
            setIsEnabled(true);
            const defs = await getNotScheduledTasks();
            setDefinitions(defs);

            if (defs.length > 0) {
                const first = defs[0];
                setSelectedTaskName(first.taskName);
                setScheduleConfig(parseCronSchedule(first.defaultCronExpression));
            } else {
                setSelectedTaskName('');
            }

            formModalRef.current?.openModal();
        },
        closeModal: () => {
            formModalRef.current?.closeModal();
        }
    }));

    const handleSelectTask = (taskName: string) => {
        setSelectedTaskName(taskName);
        const def = definitions.find((d) => d.taskName === taskName);
        if (def) {
            setScheduleConfig(parseCronSchedule(def.defaultCronExpression));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTaskName) return;

        setIsSubmitting(true);
        setErrorMessage(null);
        const finalCron = buildCronSchedule(scheduleConfig);

        try {
            const result = await createScheduledTask({
                taskName: selectedTaskName,
                cronExpression: finalCron,
                isEnabled: isEnabled
            });

            if (result) {
                onCreated?.(result);
                formModalRef.current?.closeModal();
            } else {
                setErrorMessage(t('scheduler_create_error'));
            }
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.detail || t('scheduler_create_error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <BaseFormModal
            ref={formModalRef}
            title={t('scheduler_create_task_modal_title')}
            submitHandler={handleSubmit}
            saveButtonTitle={isSubmitting ? '...' : t('scheduler_create_button')}
        >
            <VStack align="stretch" gap={4}>
                {errorMessage && (
                    <Box p={3} borderRadius="md" backgroundColor="red.900" borderColor="red.500" borderWidth="1px">
                        <Text color="red.200" fontSize="sm">{errorMessage}</Text>
                    </Box>
                )}

                {definitions.length === 0 ? (
                    <Box p={4} textAlign="center" borderRadius="md" backgroundColor="background_secondary">
                        <Text color="text_secondary" fontSize="sm">
                            {t('scheduler_no_available_tasks')}
                        </Text>
                    </Box>
                ) : (
                    <>
                        <Field.Root>
                            <Field.Label>{t('scheduler_select_job_type')}</Field.Label>
                            <BaseSelect
                                collection={definitions}
                                selectedValue={selectedDefinition}
                                labelSelector={(d) => `${d.displayName} (${d.category})`}
                                valueSelector={(d) => d.taskName}
                                onSelected={(item) => {
                                    if (item) {
                                        handleSelectTask(item.taskName);
                                    }
                                }}
                                placeholder={t('scheduler_select_job_type')}
                            />
                        </Field.Root>

                        {selectedDefinition && (
                            <Box p={3} borderRadius="md" backgroundColor="background_secondary" borderWidth="1px" borderColor="border_primary">
                                <HStack justify="space-between" mb={1}>
                                    <Text fontWeight="semibold" fontSize="sm" color="text_primary">
                                        {selectedDefinition.displayName}
                                    </Text>
                                    <Badge size="xs" colorPalette="blue">{selectedDefinition.category}</Badge>
                                </HStack>
                                <Text fontSize="xs" color="text_secondary">
                                    {selectedDefinition.description}
                                </Text>
                            </Box>
                        )}

                        <Field.Root>
                            <Field.Label>{t('scheduler_initial_state')}</Field.Label>
                            <ButtonGroup
                                options={[
                                    { value: true, label: t('scheduler_status_active') },
                                    { value: false, label: t('scheduler_status_paused') }
                                ]}
                                value={isEnabled}
                                onChange={setIsEnabled}
                            />
                        </Field.Root>

                        <CronScheduleEditor
                            config={scheduleConfig}
                            onChange={setScheduleConfig}
                        />
                    </>
                )}
            </VStack>
        </BaseFormModal>
    );
});
