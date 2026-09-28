import { forwardRef } from "react";
import { Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { DebtTagStatsEntity } from "@/models/debts/DebtTagEntity";
import { BaseModalRef } from "@/shared/utilities/modalUtilities";
import BaseModal from "@/shared/modals/BaseModal/BaseModal";
import DebtTagStatsCard from "@/pages/Debts/components/DebtTagStatsCard/DebtTagStatsCard";

interface Props {
    stats?: DebtTagStatsEntity[];
}

export const DebtTagStatsModal = forwardRef<BaseModalRef, Props>(({ stats }, ref) => {
    const { t } = useTranslation();

    return (
        <BaseModal ref={ref} title={t("debt_tag_stats_modal_title")}>
            {stats && stats.length > 0 ? (
                <DebtTagStatsCard stats={stats} />
            ) : (
                <Text color="gray.500" textAlign="center" py={4}>
                    {t("debt_tag_empty")}
                </Text>
            )}
        </BaseModal>
    );
});

export default DebtTagStatsModal;
