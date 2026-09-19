import React, { useMemo } from "react";
import { Box, Card, Flex, Button } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { MdSettings, MdBarChart } from "react-icons/md";
import { BsWallet2, BsPeople, BsListCheck } from "react-icons/bs";
import AddButton from "../../../../shared/components/AddButton/AddButton";
import SectionHeader from "../../../../shared/components/SectionHeader";
import SwitchButton from "../../../../shared/components/SwitchButton/SwitchButton";
import Placeholder from "../../../../shared/components/Placeholder/Placeholder";
import DebtTagBadge from "../DebtTagBadge/DebtTagBadge";
import { DebtEntity } from "../../../../models/debts/DebtEntity";
import { DebtTagEntity } from "../../../../models/debts/DebtTagEntity";
import { NumericMetricItem } from "../../../../shared/components/MetricItem";
import { useUserProfile } from "../../../../features/UserProfileSettingsModal/hooks/UserProfileContext";

interface Props {
    hasDebts: boolean;
    debts?: DebtEntity[];
    tags: DebtTagEntity[];
    onlyActive: boolean;
    onOnlyActiveChange: (onlyActive: boolean) => void;
    selectedTagFilter: string | null;
    onSelectedTagFilterChange: (tagId: string | null) => void;
    onAddClicked: () => void;
    onOpenTagManagerModal?: () => void;
    onOpenTagStatsModal?: () => void;
}

export const DebtsHeader: React.FC<Props> = ({
    hasDebts,
    debts = [],
    tags,
    onlyActive,
    onOnlyActiveChange,
    selectedTagFilter,
    onSelectedTagFilterChange,
    onAddClicked,
    onOpenTagManagerModal,
    onOpenTagStatsModal,
}) => {
    const { t } = useTranslation();
    const { user } = useUserProfile();
    const currencyName = user?.currency.name ?? "RUB";

    const activeDebts = useMemo(() => debts.filter((d) => Boolean(d.amount)), [debts]);
    const totalActiveAmount = useMemo(() => {
        return activeDebts.reduce((sum, d) => {
            const rate = d.currency?.rate || 1;
            return sum + d.amount * rate;
        }, 0);
    }, [activeDebts]);

    const addButton = <AddButton buttonTitle={t("debts_page_add_debt")} onClick={onAddClicked} />;

    if (!hasDebts) {
        return <Placeholder text={t("debts_page_no_debts")}>{addButton}</Placeholder>;
    }

    return (
        <Box mb={4}>
            {/* Header Card (Broker / Cash account style) */}
            <Card.Root
                backgroundColor="background_primary"
                borderColor="border_primary"
                borderRadius="xl"
                mb={3}
                boxShadow="sm"
            >
                <Card.Body padding={4}>
                    {/* Top Bar: Title + Green Add Button + Modal actions */}
                    <SectionHeader
                        title={t("debts_header_title")}
                        size="xl"
                        onAdd={onAddClicked}
                        addButtonTitle={t("debts_page_add_debt")}
                        mb={0}
                        gap={2.5}
                        rightElement={
                            <Flex alignItems="center" gap={2}>
                                {onOpenTagStatsModal && (
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={onOpenTagStatsModal}
                                        color="text_primary"
                                        borderColor="border_primary"
                                        _hover={{
                                            backgroundColor: "background_secondary",
                                            borderColor: "action_primary",
                                            color: "text_primary",
                                        }}
                                    >
                                        <MdBarChart /> {t("debt_tag_stats_btn")}
                                    </Button>
                                )}

                                {onOpenTagManagerModal && (
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={onOpenTagManagerModal}
                                        color="text_primary"
                                        borderColor="border_primary"
                                        _hover={{
                                            backgroundColor: "background_secondary",
                                            borderColor: "action_primary",
                                            color: "text_primary",
                                        }}
                                    >
                                        <MdSettings /> {t("debt_tag_manage_title")}
                                    </Button>
                                )}
                            </Flex>
                        }
                    />

                    {/* Metrics list */}
                    {debts.length > 0 && (
                        <Flex
                            pt={3}
                            mt={3}
                            borderTopWidth="1px"
                            borderColor="border_primary"
                            justifyContent="flex-start"
                            alignItems="center"
                            flexWrap="wrap"
                            gap={{ base: 4, md: 8 }}
                        >
                            <NumericMetricItem
                                icon={<BsWallet2 size={16} />}
                                iconBg="rgba(239, 68, 68, 0.15)"
                                iconColor="red.400"
                                label={t("debts_header_total_amount")}
                                value={totalActiveAmount}
                                currency={currencyName}
                                size="sm"
                            />

                            <NumericMetricItem
                                icon={<BsPeople size={16} />}
                                iconBg="rgba(59, 130, 246, 0.15)"
                                iconColor="blue.400"
                                label={t("debts_header_active_count")}
                                value={activeDebts.length}
                                size="sm"
                            />

                            <NumericMetricItem
                                icon={<BsListCheck size={16} />}
                                iconBg="rgba(168, 85, 247, 0.15)"
                                iconColor="purple.400"
                                label={t("debts_header_total_count")}
                                value={debts.length}
                                size="sm"
                            />
                        </Flex>
                    )}
                </Card.Body>
            </Card.Root>

            {/* Dedicated Filter Block: Active switch + Tags */}
            <Box
                backgroundColor="background_primary"
                borderColor="border_primary"
                borderWidth="1px"
                borderRadius="xl"
                p={3}
                boxShadow="xs"
            >
                <Flex
                    alignItems="center"
                    gap={4}
                    flexWrap="wrap"
                >
                    <SwitchButton
                        active={onlyActive}
                        title={t("debts_page_only_active")}
                        onSwitch={onOnlyActiveChange}
                    />

                    {tags && tags.length > 0 && (
                        <>
                            <Box h="20px" w="1px" bg="border_primary" display={{ base: "none", sm: "block" }} />

                            <Flex gap={2} alignItems="center" wrap="wrap">
                                <DebtTagBadge
                                    name={t("debts_all_tags")}
                                    isSelected={selectedTagFilter === null}
                                    cursor="pointer"
                                    onClick={() => onSelectedTagFilterChange(null)}
                                    px={3}
                                    py={1}
                                />
                                {tags.map((tag) => {
                                    const isSelected = selectedTagFilter === tag.id;
                                    return (
                                        <DebtTagBadge
                                            key={tag.id}
                                            name={tag.name}
                                            colorHex={tag.colorHex}
                                            isSelected={isSelected}
                                            cursor="pointer"
                                            onClick={() => onSelectedTagFilterChange(isSelected ? null : tag.id)}
                                            px={3}
                                            py={1}
                                        />
                                    );
                                })}
                            </Flex>
                        </>
                    )}
                </Flex>
            </Box>
        </Box>
    );
};

export default DebtsHeader;
