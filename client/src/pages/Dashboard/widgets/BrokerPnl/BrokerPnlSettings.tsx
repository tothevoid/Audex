import React, { useEffect, useMemo, useState } from "react";
import { Field, Flex, Skeleton, Stack, Wrap } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { WidgetSettingsProps } from "../types";
import { BrokerPnlWidgetSettings } from "./types";
import { getBrokerAccounts } from "@/api/brokers/brokerAccountApi";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";
import { ChipGroup, ChipGroupOption } from "@/shared/components/ChipGroup";

export const BrokerPnlSettings: React.FC<WidgetSettingsProps<BrokerPnlWidgetSettings>> = ({
    settings,
    updateSettings
}) => {
    const { t } = useTranslation();
    const [accounts, setAccounts] = useState<BrokerAccountEntity[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        getBrokerAccounts()
            .then((loadedAccounts) => {
                if (isMounted) {
                    setAccounts(loadedAccounts ?? []);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const selectedAccountId = settings.brokerAccountId ?? null;

    const accountOptions: ChipGroupOption<string | null>[] = useMemo(() => [
        { value: null, label: t("widget_broker_pnl_all_accounts") },
        ...accounts.map((account) => ({
            value: account.id,
            label: account.name
        }))
    ], [accounts, t]);

    const handleAccountChange = (accountId: string | null) => {
        updateSettings({ brokerAccountId: accountId });
    };

    return (
        <Stack gap={5}>
            {/* Account Selection */}
            <Field.Root>
                <Flex justify="space-between" align="center" mb={2}>
                    <Field.Label mb={0} fontWeight="bold" fontSize="sm">
                        {t("widget_broker_pnl_select_account")}
                    </Field.Label>
                </Flex>

                {isLoading ? (
                    <Wrap gap={2} mt={1}>
                        <Skeleton height="32px" width="100px" borderRadius="md" />
                        <Skeleton height="32px" width="140px" borderRadius="md" />
                    </Wrap>
                ) : (
                    <ChipGroup<string | null>
                        options={accountOptions}
                        value={selectedAccountId}
                        onChange={handleAccountChange}
                    />
                )}
            </Field.Root>
        </Stack>
    );
};
