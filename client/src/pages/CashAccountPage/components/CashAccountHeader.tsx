import React from "react";
import { Badge, Card, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { AccountEntity } from "../../../models/accounts/AccountEntity";
import { BsWallet2, BsArrowUpRight, BsArrowDownRight, BsBank } from "react-icons/bs";
import { MdSwapHoriz } from "react-icons/md";
import SectionHeader from "../../../shared/components/SectionHeader";
import StoredIcon from "../../../shared/components/StoredIcon";
import { getBankIconUrl } from "../../../api/banks/bankApi";
import { NumericMetricItem } from "../../../shared/components/MetricItem";

interface CashAccountHeaderProps {
    account: AccountEntity | null;
    totalPnl: number;
    userCurrencyName?: string;
    transactionsCount: number;
    onAddClicked: () => void;
}

export const CashAccountHeader: React.FC<CashAccountHeaderProps> = ({
    account,
    totalPnl,
    userCurrencyName,
    transactionsCount,
    onAddClicked,
}) => {
    const { t } = useTranslation();
    const isProfit = totalPnl >= 0;

    return (
        <Card.Root
            backgroundColor="background_primary"
            borderColor="border_primary"
            borderRadius="xl"
            mb={4}
            boxShadow="sm"
        >
            <Card.Body padding={4}>
                {/* Header Top Bar: Account info & Add button */}
                <SectionHeader
                    leftElement={account?.bank?.iconKey ? (
                        <StoredIcon
                            src={getBankIconUrl(account.bank.iconKey)}
                            fallbackIcon={<BsBank size={20} color="var(--chakra-colors-text_secondary)" />}
                            size="md"
                        />
                    ) : null}
                    title={account ? account.name : t("currency_transactions_title")}
                    size="xl"
                    onAdd={onAddClicked}
                    addButtonTitle={t("currency_transactions_account_add_button")}
                    extra={account?.currency?.name && (
                        <Badge colorPalette="blue" size="sm" variant="subtle">
                            {account.currency.name}
                        </Badge>
                    )}
                    subtitle={account?.accountType?.name ? `${account.accountType.name}${account.bank ? ` • ${account.bank.name}` : ''}` : undefined}
                    mb={3}
                />

                {/* Metrics list */}
                <Flex
                    pt={3}
                    mt={1}
                    borderTopWidth="1px"
                    borderColor="border_primary"
                    justifyContent="flex-start"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={{ base: 4, md: 8 }}
                >
                    <NumericMetricItem
                        icon={<BsWallet2 size={16} />}
                        iconBg="rgba(59, 130, 246, 0.15)"
                        iconColor="blue.400"
                        label={t("currency_transactions_balance")}
                        value={account?.balance}
                        currency={account?.currency?.name}
                    />

                    <NumericMetricItem
                        icon={isProfit ? <BsArrowUpRight size={16} /> : <BsArrowDownRight size={16} />}
                        iconBg={isProfit ? "pnl_positive_bg" : "pnl_negative_bg"}
                        iconColor={isProfit ? "pnl_positive" : "pnl_negative"}
                        label={t("currency_transactions_total_pnl")}
                        value={totalPnl}
                        currency={userCurrencyName}
                        isPnl
                    />

                    <NumericMetricItem
                        icon={<MdSwapHoriz size={18} />}
                        iconBg="rgba(168, 85, 247, 0.15)"
                        iconColor="purple.400"
                        label={t("currency_transactions_count")}
                        value={transactionsCount}
                    />
                </Flex>
            </Card.Body>
        </Card.Root>
    );
};

export default CashAccountHeader;
