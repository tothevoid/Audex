import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";
import { createBrokerAccount, deleteBrokerAccount, getBrokerAccounts, updateBrokerAccount } from "@/api/brokers/brokerAccountApi";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";

export const useBrokerAccounts = () => {
	const { t } = useTranslation();
	const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccountEntity[]>([]);
	const [isBrokerAccountsLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const brokerAccounts = await getBrokerAccounts();
			setBrokerAccounts(brokerAccounts);
		} catch (err: unknown) {
			setError(parseErrorMessage(err, t("error_data_load")));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const createBrokerAccountEntity = async (createdBrokerAccount: BrokerAccountEntity) => {
		const addedBrokerAccount = await createBrokerAccount(createdBrokerAccount);
		if (!addedBrokerAccount) {
			return;
		}

		await fetchData();
	};

	const updateBrokerAccountEntity = async (updatedBrokerAccount: BrokerAccountEntity) => {
		const brokerAccountUpdated = await updateBrokerAccount(updatedBrokerAccount);
		if (!brokerAccountUpdated) {
			return;
		}
		
		await fetchData();
	};

	const deleteBrokerAccountEntity = async (deletedBrokerAccount: BrokerAccountEntity) => {
		const brokerAccountDeleted = await deleteBrokerAccount(deletedBrokerAccount.id);
	
		if (!brokerAccountDeleted) {
			return;
		}

		const updatedBrokerAccounts = brokerAccounts
			.filter((brokerAccount: BrokerAccountEntity) => brokerAccount.id !== deletedBrokerAccount.id);
		setBrokerAccounts(updatedBrokerAccounts);
	};

	return {
		brokerAccounts,
		isBrokerAccountsLoading,
		error,
		createBrokerAccountEntity,
		updateBrokerAccountEntity,
		deleteBrokerAccountEntity,
		reloadBrokerAccounts: fetchData
	};
};
