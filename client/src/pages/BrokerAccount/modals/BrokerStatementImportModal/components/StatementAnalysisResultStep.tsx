import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    CloseButton,
    Flex,
    HStack,
    Spinner,
    Tabs,
    Text,
    VStack
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { BsCheckCircle, BsExclamationTriangle } from "react-icons/bs";
import { GrTransaction } from "react-icons/gr";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { applyStatementDiffs } from "../../../../../api/brokers/brokerStatementImportApi";
import {
    BrokerStatementAnalysisResultEntity,
    StatementDiffType
} from "../../../../../models/brokers/BrokerStatementImportModels";
import { StatementFilterType } from "../types";
import { StatementTransactionDiffCard } from "./StatementTransactionDiffCard";
import { StatementSecurityItem } from "./StatementSecurityItem";

interface Props {
    analysisResult: BrokerStatementAnalysisResultEntity;
    onImportSuccess: () => Promise<void> | void;
    onReanalyzeRequested: () => void;
}

export const StatementAnalysisResultStep: React.FC<Props> = ({
    analysisResult,
    onImportSuccess,
    onReanalyzeRequested
}) => {
    const { t } = useTranslation();

    const [selectedDiffIds, setSelectedDiffIds] = useState<Set<string>>(new Set());
    const [activeFilter, setActiveFilter] = useState<StatementFilterType>("all");
    const [isApplying, setIsApplying] = useState<boolean>(false);
    const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
    const [applyFeedback, setApplyFeedback] = useState<string | null>(null);
    const [applyError, setApplyError] = useState<string | null>(null);

    // Reset state when a new analysis result arrives (new session)
    useEffect(() => {
        setSelectedDiffIds(new Set());
        setActiveFilter("all");
        setApplyFeedback(null);
        setApplyError(null);
        setIsSessionExpired(false);
    }, [analysisResult.sessionId]);

    const handleApplyClicked = async () => {
        if (selectedDiffIds.size === 0) return;

        setIsApplying(true);
        setApplyFeedback(null);
        setApplyError(null);

        try {
            const applyResult = await applyStatementDiffs({
                sessionId: analysisResult.sessionId,
                selectedDiffIds: Array.from(selectedDiffIds)
            });

            if (applyResult && applyResult.isSuccess) {
                setIsSessionExpired(false);
                const resultData = applyResult.data;
                const totalTransactions =
                    (resultData?.createdTransactionsCount ?? 0) +
                    (resultData?.updatedTransactionsCount ?? 0);
                const totalSecurities = resultData?.createdSecuritiesCount ?? 0;
                setApplyFeedback(
                    t("broker_statement_apply_success", {
                        transactions: totalTransactions,
                        securities: totalSecurities
                    })
                );
                await onImportSuccess();
                onReanalyzeRequested();
            } else {
                const isExpired = applyResult?.errorCode === "SESSION_EXPIRED";
                setIsSessionExpired(isExpired);
                setApplyError(applyResult?.errorMessage || t("broker_statement_apply_error"));
            }
        } finally {
            setIsApplying(false);
        }
    };

    const toggleItemSelection = (diffItemId: string, hasWarning: boolean) => {
        if (hasWarning) return;
        setSelectedDiffIds((previous) => {
            const updated = new Set(previous);
            if (updated.has(diffItemId)) {
                updated.delete(diffItemId);
            } else {
                updated.add(diffItemId);
            }
            return updated;
        });
    };

    const onSelectRecommended = () => {
        const recommended = new Set<string>();
        analysisResult.diffItems.forEach((diffItem) => {
            if (
                !diffItem.hasWarning &&
                (diffItem.diffType === StatementDiffType.New ||
                    diffItem.diffType === StatementDiffType.FieldDiscrepancy)
            ) {
                recommended.add(diffItem.id);
            }
        });
        setSelectedDiffIds(recommended);
    };

    const onDeselectAll = () => setSelectedDiffIds(new Set());

    const actionableCount = useMemo(
        () => analysisResult.diffItems.filter(
            (diffItem) => diffItem.diffType !== StatementDiffType.Identical
        ).length,
        [analysisResult.diffItems]
    );

    const filteredDiffItems = useMemo(() => {
        return analysisResult.diffItems.filter((diffItem) => {
            if (activeFilter === "new") return diffItem.diffType === StatementDiffType.New && !diffItem.hasWarning;
            if (activeFilter === "discrepancies") return diffItem.diffType === StatementDiffType.FieldDiscrepancy;
            if (activeFilter === "identical") return diffItem.diffType === StatementDiffType.Identical;
            if (activeFilter === "missing") return diffItem.diffType === StatementDiffType.MissingInStatement;
            if (activeFilter === "warnings") return diffItem.hasWarning;
            return diffItem.diffType !== StatementDiffType.Identical;
        });
    }, [analysisResult.diffItems, activeFilter]);

    const showCheckbox = activeFilter === "all" || activeFilter === "new" || activeFilter === "discrepancies";

    return (
        <VStack gap={4} align="stretch">
            {applyFeedback && (
                <Box
                    p={3}
                    borderRadius="md"
                    backgroundColor="pnl_positive_bg"
                    borderWidth="1px"
                    borderColor="pnl_positive"
                    color="pnl_positive"
                    fontSize="sm"
                    fontWeight={600}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <HStack gap={2}>
                        <BsCheckCircle size={16} />
                        <Text>{applyFeedback}</Text>
                    </HStack>
                    <CloseButton size="xs" onClick={() => setApplyFeedback(null)} color="pnl_positive" />
                </Box>
            )}

            {applyError && (
                <Box
                    p={3}
                    borderRadius="md"
                    backgroundColor="pnl_negative_bg"
                    borderWidth="1px"
                    borderColor="pnl_negative"
                    color="pnl_negative"
                    fontSize="sm"
                    fontWeight={600}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={3}
                >
                    <HStack gap={2} flex={1}>
                        <BsExclamationTriangle size={16} />
                        <Text>{applyError}</Text>
                    </HStack>
                    <HStack gap={2}>
                        {isSessionExpired && (
                            <Button size="xs" colorPalette="red" variant="subtle" onClick={onReanalyzeRequested}>
                                {t("broker_statement_reanalyze_button")}
                            </Button>
                        )}
                        <CloseButton size="xs" onClick={() => setApplyError(null)} color="pnl_negative" />
                    </HStack>
                </Box>
            )}

            {/* Filter buttons */}
            <HStack wrap="wrap" gap={1.5} width="100%">
                <Button size="sm" variant={activeFilter === "new" ? "solid" : "outline"} onClick={() => setActiveFilter("new")}>
                    {t("broker_statement_diff_new")} ({analysisResult.newCount})
                </Button>
                <Button size="sm" variant={activeFilter === "discrepancies" ? "solid" : "outline"} onClick={() => setActiveFilter("discrepancies")}>
                    {t("broker_statement_diff_discrepancy")} ({analysisResult.discrepancyCount})
                </Button>
                <Button size="sm" variant={activeFilter === "identical" ? "solid" : "outline"} onClick={() => setActiveFilter("identical")}>
                    {t("broker_statement_diff_identical")} ({analysisResult.identicalCount})
                </Button>
                <Button size="sm" variant={activeFilter === "missing" ? "solid" : "outline"} onClick={() => setActiveFilter("missing")}>
                    {t("broker_statement_diff_missing")} ({analysisResult.missingCount})
                </Button>
                {analysisResult.warningCount > 0 && (
                    <Button size="sm" variant={activeFilter === "warnings" ? "solid" : "outline"} onClick={() => setActiveFilter("warnings")}>
                        {t("broker_statement_diff_warnings")} ({analysisResult.warningCount})
                    </Button>
                )}
                <Button size="sm" variant={activeFilter === "all" ? "solid" : "outline"} onClick={() => setActiveFilter("all")} ms="auto">
                    {t("broker_statement_filter_all")} ({actionableCount})
                </Button>
            </HStack>

            {/* Tabs: Deals & Securities */}
            <Tabs.Root defaultValue="deals" variant="enclosed">
                <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
                    <Tabs.List>
                        <Tabs.Trigger value="deals">
                            <GrTransaction />
                            {t("broker_statement_tab_transactions")}
                        </Tabs.Trigger>
                        <Tabs.Trigger value="securities">
                            <HiOutlineDocumentReport />
                            {t("broker_statement_tab_securities")}
                        </Tabs.Trigger>
                    </Tabs.List>

                    {showCheckbox && (
                        <HStack gap={2}>
                            <Button size="xs" variant="outline" onClick={onSelectRecommended}>
                                {t("broker_statement_select_recommended")}
                            </Button>
                            <Button size="xs" variant="ghost" onClick={onDeselectAll}>
                                {t("broker_statement_deselect_all")}
                            </Button>
                        </HStack>
                    )}
                </Flex>

                {/* Tab 1: Deals Diff Review */}
                <Tabs.Content value="deals">
                    <Box h="450px" overflowY="auto" pr={1}>
                        {filteredDiffItems.length === 0 ? (
                            <Flex h="100%" alignItems="center" justifyContent="center" textAlign="center" py={8}>
                                {activeFilter === "all" && analysisResult.identicalCount > 0 ? (
                                    <VStack gap={2}>
                                        <Box color="pnl_positive" fontSize="32px">
                                            <BsCheckCircle />
                                        </Box>
                                        <Text color="text_primary" fontWeight={600} fontSize="md">
                                            {t("broker_statement_all_matched")}
                                        </Text>
                                        <Text color="text_secondary" fontSize="sm">
                                            {t("broker_statement_diff_identical")}: {analysisResult.identicalCount}
                                        </Text>
                                    </VStack>
                                ) : (
                                    <Text color="text_secondary">{t("broker_statement_empty_deals")}</Text>
                                )}
                            </Flex>
                        ) : (
                            <VStack gap={2} align="stretch">
                                {filteredDiffItems.map((diffItem) => (
                                    <StatementTransactionDiffCard
                                        key={diffItem.id}
                                        diffItem={diffItem}
                                        isSelected={selectedDiffIds.has(diffItem.id)}
                                        showCheckbox={showCheckbox}
                                        onToggleSelect={toggleItemSelection}
                                    />
                                ))}
                            </VStack>
                        )}
                    </Box>
                </Tabs.Content>

                {/* Tab 2: Securities Status Overview */}
                <Tabs.Content value="securities">
                    <Box h="450px" overflowY="auto" pr={1}>
                        <VStack gap={2} align="stretch">
                            {analysisResult.securities.map((security, index) => (
                                <StatementSecurityItem
                                    key={`${security.isin ?? security.ticker}-${index}`}
                                    security={security}
                                />
                            ))}
                        </VStack>
                    </Box>
                </Tabs.Content>
            </Tabs.Root>

            {/* Apply / Done actions — owned by this step, not the parent footer */}
            <Flex justify="flex-end">
                {selectedDiffIds.size > 0 ? (
                    <Button variant="solid" onClick={handleApplyClicked} disabled={isApplying}>
                        {isApplying ? (
                            <HStack gap={2}>
                                <Spinner size="xs" />
                                <Text>{t("broker_statement_applying")}</Text>
                            </HStack>
                        ) : (
                            <HStack gap={1.5}>
                                <BsCheckCircle size={13} />
                                <Text>
                                    {t("broker_statement_btn_apply")} ({selectedDiffIds.size})
                                </Text>
                            </HStack>
                        )}
                    </Button>
                ) : (
                    applyFeedback && (
                        <Text fontSize="sm" color="pnl_positive" fontWeight={500}>
                            ✓ {t("broker_statement_btn_done")}
                        </Text>
                    )
                )}
            </Flex>
        </VStack>
    );
};
