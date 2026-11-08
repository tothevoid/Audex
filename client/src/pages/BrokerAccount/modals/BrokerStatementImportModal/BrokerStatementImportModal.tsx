import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseModal from "@/shared/modals/BaseModal/BaseModal";
import { Nullable } from "@/shared/utilities/nullable";
import { analyzeBrokerStatement } from "@/api/brokers/brokerStatementImportApi";
import { BrokerStatementAnalysisResultEntity } from "@/models/brokers/BrokerStatementImportModels";
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
        const modalRef = useRef<BaseModalRef>(null);

        // Bridge state: only what crosses the step boundary
        const [step, setStep] = useState<1 | 2>(1);
        const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
        const [statementConfig, setStatementConfig] = useState<StatementConfig | null>(null);
        const [analysisResult, setAnalysisResult] = useState<Nullable<BrokerStatementAnalysisResultEntity>>(null);
        const [modalSessionKey, setModalSessionKey] = useState<number>(0);

        useImperativeHandle(ref, () => ({
            openModal: () => {
                setStep(1);
                setStatementConfig(null);
                setAnalysisResult(null);
                setModalSessionKey((previousKey) => previousKey + 1);
                modalRef.current?.openModal();
            },
            closeModal: () => {
                modalRef.current?.closeModal();
            }
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

        const handleClose = () => {
            modalRef.current?.closeModal();
        };

        return (
            <BaseModal
                ref={modalRef}
                size={step === 2 ? "xl" : "lg"}
                maxW={step === 2 ? "1050px" : "600px"}
                minH={step === 2 ? "680px" : undefined}
                title={t("broker_statement_modal_title")}
                hasBody={false}
            >
                {step === 1 && (
                    <StatementConfigStep
                        key={modalSessionKey}
                        defaultBrokerAccountId={defaultBrokerAccountId}
                        isAnalyzing={isAnalyzing}
                        onSubmit={handleConfigSubmit}
                        onCancel={handleClose}
                    />
                )}
                {step === 2 && analysisResult && (
                    <StatementAnalysisResultStep
                        key={analysisResult.sessionId}
                        analysisResult={analysisResult}
                        onImportSuccess={onImportSuccess}
                        onReanalyzeRequested={handleReanalyzeRequested}
                        onBack={() => setStep(1)}
                    />
                )}
            </BaseModal>
        );
    }
);

BrokerStatementImportModal.displayName = "BrokerStatementImportModal";
