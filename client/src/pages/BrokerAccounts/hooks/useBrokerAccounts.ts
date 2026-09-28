import { useCallback, useEffect, useState } from "react";
import { BrokerAccountEntity } from "@/models/brokers/BrokerAccountEntity";
import { createBrokerAccount, deleteBrokerAccount, getBrokerAccounts, updateBrokerAccount } from "@/api/brokers/brokerAccountApi";

export const useBrokerAccounts = () => {
	const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccountEntity[]>([]);
	const [isBrokerAccountsLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const brokerAccounts = await getBrokerAccounts();
			setBrokerAccounts(brokerAccounts);
		} catch (err: any) {
			setError(err.message || 'Ошибка загрузки данных');
		} finally {
			setLoading(false);
		}
	}, []);

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
