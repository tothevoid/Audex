import { forwardRef, useImperativeHandle, useState } from "react";
import {
    Button,
    CloseButton,
    Dialog,
    HStack,
    Portal,
    Text,
    useDisclosure
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { BsArrowLeft } from "react-icons/bs";
import { BaseModalRef } from "../../../../shared/utilities/modalUtilities";
import { Nullable } from "../../../../shared/utilities/nullable";
import { analyzeBrokerStatement } from "../../../../api/brokers/brokerStatementImportApi";
import { BrokerStatementAnalysisResultEntity } from "../../../../models/brokers/BrokerStatementImportModels";
import { StatementConfig } from "./types";
import { StatementConfigStep } from "./components/StatementConfigStep";
import { StatementAnalysisResultStep } from "./components/StatementAnalysisResultStep";

interface Props {
    defaultBrokerAccountId?: Nullable<string>;
    onImportSuccess: () => Promise<void> | void;
}

export const BrokerStatementImportModal = forwardRef<BaseModalRef, Props>(
    ({ defaultBrokerAccountId, onImportSuccess }, ref) => {
        const { t } = useTranslation();
        const { open, onOpen, onClose } = useDisclosure();

        // Bridge state: only what crosses the step boundary
        const [step, setStep] = useState<1 | 2>(1);
        const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
        const [statementConfig, setStatementConfig] = useState<StatementConfig | null>(null);
        const [analysisResult, setAnalysisResult] = useState<Nullable<BrokerStatementAnalysisResultEntity>>(null);

        useImperativeHandle(ref, () => ({
            openModal: () => {
                setStep(1);
                setStatementConfig(null);
                setAnalysisResult(null);
                onOpen();
            },
            closeModal: onClose
        }));

        const runAnalysis = async (config: StatementConfig) => {
            setIsAnalyzing(true);
            try {
                const result = await analyzeBrokerStatement(
                    config.file,
                    config.accountId,
                    config.importerId,
                    config.timeZoneId
                );
                if (result) {
                    setAnalysisResult(result);
                    setStep(2);
                }
            } finally {
                setIsAnalyzing(false);
            }
        };

        const handleConfigSubmit = (config: StatementConfig) => {
            setStatementConfig(config);
            runAnalysis(config);
        };

        const handleReanalyzeRequested = () => {
            if (statementConfig) {
                runAnalysis(statementConfig);
            }
        };

        return (
            <Dialog.Root
                size={step === 2 ? "xl" : "lg"}
                placement="center"
                open={open}
                onEscapeKeyDown={onClose}
                onOpenChange={(event) => { if (!event.open) onClose(); }}
            >
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content
                            backgroundColor="background_primary"
                            borderColor="border_primary"
                            color="text_primary"
                            maxW={step === 2 ? "1050px" : "600px"}
                            minH={step === 2 ? "680px" : undefined}
                        >
                            <Dialog.Header>
                                <Dialog.Title color="text_primary" fontSize="lg" fontWeight={700}>
                                    {t("broker_statement_modal_title")}
                                </Dialog.Title>
                            </Dialog.Header>

                            <Dialog.Body pb={6}>
                                {step === 1 && (
                                    <StatementConfigStep
                                        defaultBrokerAccountId={defaultBrokerAccountId}
                                        isAnalyzing={isAnalyzing}
                                        onSubmit={handleConfigSubmit}
                                    />
                                )}
                                {step === 2 && analysisResult && (
                                    <StatementAnalysisResultStep
                                        analysisResult={analysisResult}
                                        onImportSuccess={onImportSuccess}
                                        onReanalyzeRequested={handleReanalyzeRequested}
                                    />
                                )}
                            </Dialog.Body>

                            <Dialog.Footer gap={3}>
                                {step === 1 ? (
                                    <Button onClick={onClose} variant="outline">
                                        {t("modals_cancel_button")}
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={() => setStep(1)}>
                                        <HStack gap={1.5}>
                                            <BsArrowLeft size={13} />
                                            <Text>{t("broker_statement_btn_back")}</Text>
                                        </HStack>
                                    </Button>
                                )}
                            </Dialog.Footer>

                            <Dialog.CloseTrigger asChild>
                                <CloseButton onClick={onClose} size="sm" color="text_primary" />
                            </Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        );
    }
);

BrokerStatementImportModal.displayName = "BrokerStatementImportModal";
