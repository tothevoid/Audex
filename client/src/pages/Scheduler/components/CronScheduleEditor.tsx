import React, { useMemo } from 'react';
import { Box, Field, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
    buildCronSchedule,
    clampIntervalValue,
    CronFrequency,
    CronScheduleConfig,
    formatCronExpression,
    FREQUENCY_OPTIONS,
    getCronWeekDays,
    getMaxIntervalValue,
    toggleCronWeekDay
} from '@/pages/Scheduler/schedulerUtils';
import ButtonGroup from '@/shared/components/ButtonGroup/ButtonGroup';
import TimeInput from '@/shared/components/TimeInput/TimeInput';

interface CronScheduleEditorProps {
    config: CronScheduleConfig;
    onChange: (updated: CronScheduleConfig) => void;
}

export const CronScheduleEditor: React.FC<CronScheduleEditorProps> = ({ config, onChange }) => {
    const { t, i18n } = useTranslation();
    const days = useMemo(() => getCronWeekDays(i18n), [i18n]);

    const currentCron = useMemo(() => buildCronSchedule(config), [config]);

    const update = (partial: Partial<CronScheduleConfig>) => {
        onChange({ ...config, ...partial });
    };

    const handleToggleDay = (dayKey: string) => {
        update({ selectedDays: toggleCronWeekDay(config.selectedDays, dayKey) });
    };

    const frequencyOptions = useMemo(() => (
        FREQUENCY_OPTIONS.map((opt) => ({
            value: opt.key,
            label: t(opt.labelKey)
        }))
    ), [t]);

    const dayOptions = useMemo(() => (
        days.map((d) => ({
            value: d.key,
            label: d.label
        }))
    ), [days]);

    return (
        <VStack align="stretch" gap={4}>
            <Field.Root>
                <Field.Label>{t('scheduler_frequency')}</Field.Label>
                <ButtonGroup
                    options={frequencyOptions}
                    value={config.frequency}
                    onChange={(val) => update({ frequency: val })}
                />
            </Field.Root>

            {(config.frequency === CronFrequency.Daily || config.frequency === CronFrequency.Weekly) && (
                <Field.Root>
                    <Field.Label>{t('scheduler_time')}</Field.Label>
                    <TimeInput
                        value={config.time}
                        onChange={(val) => update({ time: val })}
                    />
                </Field.Root>
            )}

            {config.frequency === CronFrequency.Weekly && (
                <Field.Root>
                    <Field.Label>{t('scheduler_days_of_week')}</Field.Label>
                    <ButtonGroup
                        isMulti
                        options={dayOptions}
                        values={config.selectedDays}
                        onToggle={handleToggleDay}
                        size="xs"
                    />
                </Field.Root>
            )}

            {(config.frequency === CronFrequency.IntervalMinutes || config.frequency === CronFrequency.IntervalHours) && (
                <Field.Root>
                    <Field.Label>{t('scheduler_interval_value')}</Field.Label>
                    <Input
                        type="number"
                        min={1}
                        max={getMaxIntervalValue(config.frequency)}
                        value={config.intervalValue}
                        onChange={(e) => update({ intervalValue: clampIntervalValue(e.target.value, config.frequency) })}
                        backgroundColor="background_primary"
                        color="text_primary"
                        borderColor="border_primary"
                        maxW="200px"
                    />
                </Field.Root>
            )}

            {config.frequency === CronFrequency.Cron && (
                <Field.Root>
                    <Field.Label>{t('scheduler_cron_expression')}</Field.Label>
                    <Input
                        value={config.customCron}
                        onChange={(e) => update({ customCron: e.target.value })}
                        placeholder="0 9 * * 1"
                        backgroundColor="background_primary"
                        color="text_primary"
                        borderColor="border_primary"
                    />
                </Field.Root>
            )}

            <Box p={3} borderRadius="md" backgroundColor="background_secondary" borderWidth="1px" borderColor="border_primary">
                <Flex justify="space-between" align="center">
                    <Text fontSize="xs" color="text_secondary">
                        Cron:
                    </Text>
                    <Text fontSize="sm" fontFamily="monospace" fontWeight="bold" color="text_primary">
                        {currentCron}
                    </Text>
                </Flex>
                {currentCron && (
                    <Text fontSize="xs" color="text_secondary" mt={1}>
                        {formatCronExpression(currentCron, i18n)}
                    </Text>
                )}
            </Box>
        </VStack>
    );
};
