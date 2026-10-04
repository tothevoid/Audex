import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Field, Input, NativeSelect, Stack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { WidgetConfig } from "@/models/dashboard/WidgetEntity";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseFormModal from "@/shared/modals/BaseFormModal/BaseFormModal";

export interface BaseWidgetSettingsModalRef<TSettings = Record<string, unknown>> extends BaseModalRef {
    openWithWidget: (widget: WidgetConfig<TSettings>) => void;
}

export interface BaseWidgetSettingsModalProps<TSettings = Record<string, unknown>> {
    title?: string;
    saveButtonTitle?: string;
    onSaveWidget: (updatedWidget: WidgetConfig<TSettings>) => void;
    renderCustomSettings?: (
        settings: TSettings,
        updateSettings: (newSettings: Partial<TSettings>) => void
    ) => React.ReactNode;
}

export const BaseWidgetSettingsModal = forwardRef(<TSettings extends Record<string, unknown> = Record<string, unknown>>(
    props: BaseWidgetSettingsModalProps<TSettings>,
    ref: React.Ref<BaseWidgetSettingsModalRef<TSettings>>
) => {
    const {
        title: modalTitleProp,
        saveButtonTitle,
        onSaveWidget,
        renderCustomSettings
    } = props;

    const { t } = useTranslation();
    const modalRef = useRef<BaseModalRef>(null);

    const [currentWidget, setCurrentWidget] = useState<WidgetConfig<TSettings> | null>(null);
    const [title, setTitle] = useState("");
    const [refreshInterval, setRefreshInterval] = useState<number>(60);
    const [customSettings, setCustomSettings] = useState<TSettings>({} as TSettings);

    useImperativeHandle(ref, () => ({
        openModal: () => modalRef.current?.openModal(),
        closeModal: () => modalRef.current?.closeModal(),
        openWithWidget: (widget: WidgetConfig<TSettings>) => {
            setCurrentWidget(widget);
            setTitle(widget.title);
            setRefreshInterval(widget.refreshIntervalSeconds);
            setCustomSettings(widget.settings ?? ({} as TSettings));
            modalRef.current?.openModal();
        }
    }));

    const handleUpdateSettings = (partial: Partial<TSettings>) => {
        setCustomSettings(prev => ({ ...prev, ...partial }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentWidget) return;

        const updatedWidget: WidgetConfig<TSettings> = {
            ...currentWidget,
            title: title.trim() || currentWidget.title,
            refreshIntervalSeconds: Number(refreshInterval),
            settings: customSettings
        };

        onSaveWidget(updatedWidget);
        modalRef.current?.closeModal();
    };

    return (
        <BaseFormModal
            ref={modalRef}
            title={modalTitleProp ?? t("widget_settings")}
            saveButtonTitle={saveButtonTitle ?? t("widget_save_settings")}
            submitHandler={handleSubmit}
            size="md"
        >
            <Stack gap={4}>
                <Field.Root>
                    <Field.Label>{t("dashboard_create_title")}</Field.Label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t("dashboard_create_title")}
                        backgroundColor="background_secondary"
                        borderColor="border_primary"
                        color="text_primary"
                    />
                </Field.Root>

                <Field.Root>
                    <Field.Label>{t("widget_refresh_interval")}</Field.Label>
                    <NativeSelect.Root>
                        <NativeSelect.Field
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                            backgroundColor="background_secondary"
                            borderColor="border_primary"
                            color="text_primary"
                        >
                            <option value={0}>{t("widget_refresh_manual")}</option>
                            <option value={30}>{t("widget_refresh_30s")}</option>
                            <option value={60}>{t("widget_refresh_1m")}</option>
                            <option value={300}>{t("widget_refresh_5m")}</option>
                            <option value={900}>{t("widget_refresh_15m")}</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </Field.Root>

                {renderCustomSettings && renderCustomSettings(customSettings, handleUpdateSettings)}
            </Stack>
        </BaseFormModal>
    );
}) as <TSettings extends Record<string, unknown> = Record<string, unknown>>(
    props: BaseWidgetSettingsModalProps<TSettings> & { ref?: React.Ref<BaseWidgetSettingsModalRef<TSettings>> }
) => React.ReactElement;
