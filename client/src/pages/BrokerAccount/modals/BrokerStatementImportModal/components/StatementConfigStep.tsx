import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { BsFileEarmarkSpreadsheet, BsUpload } from "react-icons/bs";
import { getBrokerAccounts } from "../../../../../api/brokers/brokerAccountApi";
import { BrokerAccountEntity } from "../../../../../models/brokers/BrokerAccountEntity";
import { getStatementImporters } from "../../../../../api/brokers/brokerStatementImportApi";
import { getTimeZones } from "../../../../../api/common/timeZoneApi";
import { TimeZoneEntity } from "../../../../../models/common/TimeZoneEntity";
import { BrokerStatementImporterEntity } from "../../../../../models/brokers/BrokerStatementImportModels";
import { Nullable } from "../../../../../shared/utilities/nullable";
import { useUserProfile } from "../../../../../features/UserProfileSettingsModal/hooks/UserProfileContext";
import BaseSelect from "../../../../../shared/components/BaseSelect/BaseSelect";
import { StatementConfig } from "../types";

interface Props {
    defaultBrokerAccountId?: Nullable<string>;
    isAnalyzing: boolean;
    onSubmit: (config: StatementConfig) => void;
}

export const StatementConfigStep: React.FC<Props> = ({
    defaultBrokerAccountId,
    isAnalyzing,
    onSubmit
}) => {
    const { t } = useTranslation();
    const { user } = useUserProfile();

    const isAccountLocked = Boolean(defaultBrokerAccountId);

    const [importers, setImporters] = useState<BrokerStatementImporterEntity[]>([]);
    const [timeZones, setTimeZones] = useState<TimeZoneEntity[]>([]);
    const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccountEntity[]>([]);

    const [selectedImporterId, setSelectedImporterId] = useState<string>("");
    const [selectedAccountId, setSelectedAccountId] = useState<string>(defaultBrokerAccountId ?? "");
    const [selectedTimeZoneId, setSelectedTimeZoneId] = useState<string>(
        user?.timeZoneId || Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow"
    );
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (defaultBrokerAccountId) {
            setSelectedAccountId(defaultBrokerAccountId);
        }
    }, [defaultBrokerAccountId]);

    useEffect(() => {
        if (user?.timeZoneId) {
            setSelectedTimeZoneId(user.timeZoneId);
        }
    }, [user?.timeZoneId]);

    useEffect(() => {
        const loadReferenceData = async () => {
            const [loadedImporters, loadedTimeZones, loadedAccounts] = await Promise.all([
                getStatementImporters(),
                getTimeZones(),
                getBrokerAccounts()
            ]);

            setImporters(loadedImporters);
            setTimeZones(loadedTimeZones);
            setBrokerAccounts(loadedAccounts);

            if (loadedImporters.length > 0) {
                setSelectedImporterId((previous) =>
                    previous && loadedImporters.some((importer) => importer.id === previous)
                        ? previous
                        : loadedImporters[0].id
                );
            }

            if (loadedTimeZones.length > 0) {
                if (user?.timeZoneId && loadedTimeZones.some((timeZone) => timeZone.id === user.timeZoneId)) {
                    setSelectedTimeZoneId(user.timeZoneId);
                } else {
                    setSelectedTimeZoneId((previous) => {
                        if (previous && loadedTimeZones.some((timeZone) => timeZone.id === previous)) return previous;
                        const moscowTimeZone = loadedTimeZones.find((timeZone) => timeZone.id === "Europe/Moscow");
                        return moscowTimeZone ? moscowTimeZone.id : loadedTimeZones[0].id;
                    });
                }
            }

            if (defaultBrokerAccountId) {
                setSelectedAccountId(defaultBrokerAccountId);
            } else if (!selectedAccountId && loadedAccounts.length > 0) {
                setSelectedAccountId(loadedAccounts[0].id);
            }
        };

        loadReferenceData();
    }, [defaultBrokerAccountId]);

    const handleAnalyzeClicked = () => {
        if (!selectedFile) {
            setValidationError(t("broker_statement_file_required"));
            return;
        }
        if (!selectedAccountId) {
            setValidationError(t("broker_statement_account_required"));
            return;
        }
        setValidationError(null);
        onSubmit({
            file: selectedFile,
            accountId: selectedAccountId,
            importerId: selectedImporterId,
            timeZoneId: selectedTimeZoneId
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
            setValidationError(null);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            setSelectedFile(event.dataTransfer.files[0]);
            setValidationError(null);
        }
    };

    const selectedImporter = useMemo(
        () => importers.find((importer) => importer.id === selectedImporterId) ?? null,
        [importers, selectedImporterId]
    );

    const selectedAccount = useMemo(
        () => brokerAccounts.find((account) => account.id === selectedAccountId) ?? null,
        [brokerAccounts, selectedAccountId]
    );

    const selectedTimeZone = useMemo(
        () => timeZones.find((timeZone) => timeZone.id === selectedTimeZoneId) ?? null,
        [timeZones, selectedTimeZoneId]
    );

    const supportedExtensions = selectedImporter?.supportedExtensions?.join(",") || ".xlsx";
    const fileSizeInKilobytes = selectedFile ? (selectedFile.size / 1024).toFixed(1) : null;

    return (
        <VStack gap={4} align="stretch">
            {/* Importer Selector */}
            <Box>
                <Text fontSize="sm" fontWeight={600} mb={1.5} color="text_primary">
                    {t("broker_statement_field_importer")}
                </Text>
                <BaseSelect<BrokerStatementImporterEntity>
                    collection={importers}
                    selectedValue={selectedImporter}
                    onSelected={(importer) => importer && setSelectedImporterId(importer.id)}
                    labelSelector={(importer) => importer.name}
                    valueSelector={(importer) => importer.id}
                    placeholder={t("broker_statement_select_importer_placeholder")}
                />
            </Box>

            {/* Broker Account Selector */}
            <Box>
                <Text fontSize="sm" fontWeight={600} mb={1.5} color="text_primary">
                    {t("broker_statement_field_broker_account")}
                </Text>
                <BaseSelect<BrokerAccountEntity>
                    collection={brokerAccounts}
                    selectedValue={selectedAccount}
                    onSelected={(account) => {
                        if (!isAccountLocked && account) {
                            setSelectedAccountId(account.id);
                        }
                    }}
                    labelSelector={(account) => account.name}
                    valueSelector={(account) => account.id}
                    placeholder={t("broker_statement_select_account_placeholder")}
                    isDisabled={isAccountLocked}
                />
            </Box>

            {/* Time Zone Selector */}
            <Box>
                <Text fontSize="sm" fontWeight={600} mb={1.5} color="text_primary">
                    {t("broker_statement_field_timezone")}
                </Text>
                <BaseSelect<TimeZoneEntity>
                    collection={timeZones}
                    selectedValue={selectedTimeZone}
                    onSelected={(timeZone) => timeZone && setSelectedTimeZoneId(timeZone.id)}
                    labelSelector={(timeZone) => timeZone.displayName}
                    valueSelector={(timeZone) => timeZone.id}
                    placeholder={t("broker_statement_select_timezone_placeholder")}
                />
            </Box>

            {/* File Drag and Drop Area */}
            <Box>
                <Text fontSize="sm" fontWeight={600} mb={1.5} color="text_primary">
                    {t("broker_statement_field_file")}
                </Text>
                <Box
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor={selectedFile ? "action_primary" : "border_primary"}
                    borderRadius="xl"
                    p={6}
                    textAlign="center"
                    backgroundColor="background_secondary"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ borderColor: "action_primary" }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={supportedExtensions}
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />
                    <VStack gap={2}>
                        <Box color="action_primary" fontSize="32px">
                            {selectedFile ? <BsFileEarmarkSpreadsheet /> : <BsUpload />}
                        </Box>
                        <Text
                            fontSize="sm"
                            fontWeight={600}
                            color="text_primary"
                            maxW="100%"
                            wordBreak="break-word"
                            overflowWrap="anywhere"
                            textAlign="center"
                            px={2}
                        >
                            {selectedFile ? selectedFile.name : t("broker_statement_drop_file_here")}
                        </Text>
                        {fileSizeInKilobytes && (
                            <Text fontSize="xs" color="text_secondary">
                                {fileSizeInKilobytes} KB
                            </Text>
                        )}
                    </VStack>
                </Box>
            </Box>

            {validationError && (
                <Text fontSize="xs" color="loss" fontWeight={500}>
                    {validationError}
                </Text>
            )}

            {/* Analyze action — owned by this step */}
            <HStack justify="flex-end">
                <Button variant="solid" onClick={handleAnalyzeClicked} disabled={isAnalyzing}>
                    {isAnalyzing ? (
                        <HStack gap={2}>
                            <Spinner size="xs" />
                            <Text>{t("broker_statement_analyzing")}</Text>
                        </HStack>
                    ) : (
                        t("broker_statement_analyze_button")
                    )}
                </Button>
            </HStack>
        </VStack>
    );
};
