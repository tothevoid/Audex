import { forwardRef, useImperativeHandle, useRef } from "react";
import { Box, Card, Flex, HStack, SimpleGrid, Stack, Tabs, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { WidgetConfig } from "@/models/dashboard/WidgetEntity";
import { createDefaultWidgetFromTemplate } from "@/models/dashboard/WidgetTemplate";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseModal from "@/shared/modals/BaseModal/BaseModal";
import { getAllWidgetTemplates, getWidgetDescriptor, WidgetTemplateInfo } from "../../widgets";

interface AddWidgetModalProps {
    onSelectWidget: (widget: WidgetConfig) => void;
}

export const AddWidgetModal = forwardRef<BaseModalRef, AddWidgetModalProps>(({
    onSelectWidget
}, ref) => {
    const { t } = useTranslation();
    const modalRef = useRef<BaseModalRef>(null);

    const widgetTemplates = getAllWidgetTemplates();
    const staticTemplates = widgetTemplates.filter(template => template.isStatic);
    const dynamicTemplates = widgetTemplates.filter(template => !template.isStatic);

    useImperativeHandle(ref, () => ({
        openModal: () => modalRef.current?.openModal(),
        closeModal: () => modalRef.current?.closeModal()
    }));

    const handleSelect = (template: WidgetTemplateInfo) => {
        if (!template.isAvailable) return;
        modalRef.current?.closeModal();
        const descriptor = getWidgetDescriptor(template.type);
        const defaultSettings = descriptor ? descriptor.getDefaultSettings() : {};
        const draftWidget = createDefaultWidgetFromTemplate(
            template,
            t(template.titleKey),
            0,
            defaultSettings
        );
        onSelectWidget(draftWidget);
    };

    const renderTemplatesGrid = (templates: WidgetTemplateInfo[]) => {
        if (templates.length === 0) {
            return (
                <Box
                    p={8}
                    textAlign="center"
                    borderRadius="md"
                    bg="background_secondary"
                    borderWidth="1px"
                    borderColor="border_primary"
                >
                    <Text fontSize="sm" color="text_secondary">
                        {t("dashboard_no_available_widgets")}
                    </Text>
                </Box>
            );
        }

        return (
            <Box height="100%" overflowY="auto" pr={1}>
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3} mt={1}>
                    {templates.map(template => (
                        <Card.Root
                            key={template.type}
                            p={3}
                            minH="88px"
                            display="flex"
                            flexDirection="column"
                            justifyContent="space-between"
                            cursor={template.isAvailable ? "pointer" : "not-allowed"}
                            opacity={template.isAvailable ? 1 : 0.65}
                            backgroundColor="background_primary"
                            borderColor="border_primary"
                            borderWidth="1px"
                            borderRadius="md"
                            transition="all 0.15s ease"
                            onClick={() => handleSelect(template)}
                            _hover={{
                                borderColor: template.isAvailable ? "action_primary" : "border_primary",
                                backgroundColor: template.isAvailable ? "background_secondary" : "background_primary"
                            }}
                        >
                            <Flex justify="space-between" align="flex-start">
                                <HStack gap={2}>
                                    <Box color="action_primary" fontSize="1.4rem">
                                        {template.icon}
                                    </Box>
                                    <Text fontWeight="bold" fontSize="sm" color="text_primary">
                                        {t(template.titleKey)}
                                    </Text>
                                </HStack>
                            </Flex>

                            <Text fontSize="xs" color="text_secondary" mt={2}>
                                {t(template.descKey)}
                            </Text>
                        </Card.Root>
                    ))}
                </SimpleGrid>
            </Box>
        );
    };

    return (
        <BaseModal
            ref={modalRef}
            title={t("dashboard_add_modal_title")}
            maxW="750px"
        >
            <Stack gap={3}>
                <Text fontSize="sm" color="text_secondary">
                    {t("dashboard_add_modal_desc")}
                </Text>

                <Box minH="480px" maxH="480px" display="flex" flexDirection="column">
                    <Tabs.Root lazyMount={true} unmountOnExit={true} defaultValue="static" variant="enclosed" display="flex" flexDirection="column" flex="1">
                        <Tabs.List background="background_primary">
                            <Tabs.Trigger value="static">
                                {t("dashboard_tab_static_widgets")}
                            </Tabs.Trigger>
                            <Tabs.Trigger value="dynamic">
                                {t("dashboard_tab_dynamic_widgets")}
                            </Tabs.Trigger>
                        </Tabs.List>
                        <Tabs.Content value="static" pt={3} px={0} flex="1" overflowY="auto">
                            {renderTemplatesGrid(staticTemplates)}
                        </Tabs.Content>
                        <Tabs.Content value="dynamic" pt={3} px={0} flex="1" overflowY="auto">
                            {renderTemplatesGrid(dynamicTemplates)}
                        </Tabs.Content>
                    </Tabs.Root>
                </Box>
            </Stack>
        </BaseModal>
    );
});

AddWidgetModal.displayName = "AddWidgetModal";
