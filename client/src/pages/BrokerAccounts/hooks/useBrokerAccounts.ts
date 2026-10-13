import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";
import { createBrokerAccount, deleteBrokerAccount, getBrokerAccounts, updateBrokerAccount } from "@/api/brokers/brokerAccountApi";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";
import { notify } from "@/shared/components/Toaster";

export const useBrokerAccounts = () => {
	const { t } = useTranslation();
	const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccountEntity[]>([]);
	const [isBrokerAccountsLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);

	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	const reloadBrokerAccounts = useCallback(() => {
		setRefreshTrigger((previousTrigger) => previousTrigger + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			setLoading(true);
			try {
				const accounts = await getBrokerAccounts();
				if (isMounted) {
					setBrokerAccounts(accounts);
					setError(null);
				}
			} catch (error: unknown) {
				if (isMounted) {
					setError(parseErrorMessage(error, t("error_data_load")));
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		load();

		return () => {
			isMounted = false;
		};
	}, [refreshTrigger, t]);

	const createBrokerAccountEntity = async (createdBrokerAccount: BrokerAccountEntity) => {
		const addedBrokerAccount = await createBrokerAccount(createdBrokerAccount);
		if (!addedBrokerAccount) {
			return;
		}

		reloadBrokerAccounts();
		notify.success(
			t("broker_account_toast_created_title"),
			t("broker_account_toast_created_desc", { name: createdBrokerAccount.name })
		);
	};

	const updateBrokerAccountEntity = async (updatedBrokerAccount: BrokerAccountEntity) => {
		const brokerAccountUpdated = await updateBrokerAccount(updatedBrokerAccount);
		if (!brokerAccountUpdated) {
			return;
		}
		
		reloadBrokerAccounts();
		notify.success(
			t("broker_account_toast_updated_title"),
			t("broker_account_toast_updated_desc", { name: updatedBrokerAccount.name })
		);
	};

	const deleteBrokerAccountEntity = async (deletedBrokerAccount: BrokerAccountEntity) => {
		const brokerAccountDeleted = await deleteBrokerAccount(deletedBrokerAccount.id);
	
		if (!brokerAccountDeleted) {
			return;
		}

		reloadBrokerAccounts();
		notify.success(
			t("broker_account_toast_deleted_title"),
			t("broker_account_toast_deleted_desc", { name: deletedBrokerAccount.name })
		);
	};

	return {
		brokerAccounts,
		isBrokerAccountsLoading,
		error,
		createBrokerAccountEntity,
		updateBrokerAccountEntity,
		deleteBrokerAccountEntity,
		reloadBrokerAccounts
	};
};
