import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Field, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { BaseModalRef } from '../../../shared/utilities/modalUtilities';
import BaseFormModal from '../../../shared/modals/BaseFormModal/BaseFormModal';
import { ScheduledTaskEntity } from '../../../models/scheduler/ScheduledTaskEntity';
import { updateSchedule } from '../../../api/scheduler/schedulerTaskApi';
import {
    buildCronSchedule,
    CronScheduleConfig,
    DEFAULT_CRON_SCHEDULE,
    parseCronSchedule
} from '../schedulerUtils';
import { CronScheduleEditor } from './CronScheduleEditor';
import ButtonGroup from '../../../shared/components/ButtonGroup/ButtonGroup';

export interface ScheduleConfigModalRef {
    openModal: (task: ScheduledTaskEntity) => void;
    closeModal: () => void;
}

interface ScheduleConfigModalProps {
    onSaved: () => void;
}

export const ScheduleConfigModal = forwardRef<ScheduleConfigModalRef, ScheduleConfigModalProps>(({ onSaved }, ref) => {
    const { t } = useTranslation();
    const formModalRef = useRef<BaseModalRef>(null);

    const [currentTask, setCurrentTask] = useState<ScheduledTaskEntity | null>(null);
    const [isEnabled, setIsEnabled] = useState<boolean>(true);
    const [scheduleConfig, setScheduleConfig] = useState<CronScheduleConfig>(DEFAULT_CRON_SCHEDULE);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useImperativeHandle(ref, () => ({
        openModal: (task: ScheduledTaskEntity) => {
            setCurrentTask(task);
            setIsEnabled(task.isEnabled);
            setScheduleConfig(parseCronSchedule(task.cronExpression));
            formModalRef.current?.openModal();
        },
        closeModal: () => {
            formModalRef.current?.closeModal();
        }
    }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTask) return;

        setIsSubmitting(true);
        const finalCron = buildCronSchedule(scheduleConfig);

        try {
            const result = await updateSchedule(currentTask.taskName, {
                cronExpression: finalCron,
                isEnabled: isEnabled
            });

            if (result) {
                onSaved();
                formModalRef.current?.closeModal();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <BaseFormModal
            ref={formModalRef}
            title={`${t('scheduler_configure_title')}: ${currentTask?.displayName ?? ''}`}
            submitHandler={handleSubmit}
            saveButtonTitle={isSubmitting ? '...' : t('scheduler_save')}
        >
            <VStack align="stretch" gap={4}>
                <Field.Root>
                    <Field.Label>{t('scheduler_status')}</Field.Label>
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
            </VStack>
        </BaseFormModal>
    );
});

