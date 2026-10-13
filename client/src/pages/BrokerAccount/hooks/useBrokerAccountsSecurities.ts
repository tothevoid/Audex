import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrokerAccountSecurityEntity } from "@/models/brokers/BrokerAccountSecurityEntity";
import { getSecuritiesByBrokerAccount } from "@/api/brokers/brokerAccountSecurityApi";
import { Nullable } from "@/shared/utilities/nullable";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";

export const useBrokerAccountsSecurities = (
	brokerAccountId?: Nullable<string>,
	externalRefreshTrigger?: number
) => {
	const { t } = useTranslation();
	const [brokerAccountSecurities, setBrokerAccountSecurities] = useState<BrokerAccountSecurityEntity[]>([]);
	const [isBrokerAccountSecuritiesLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);

	const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

	const reloadBrokerAccountSecurities = useCallback(() => {
		setRefreshTrigger((previousTrigger) => previousTrigger + 1);
	}, []);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			setLoading(true);
			try {
				const securities = await getSecuritiesByBrokerAccount(brokerAccountId);
				if (isMounted) {
					setBrokerAccountSecurities(securities);
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
	}, [brokerAccountId, refreshTrigger, externalRefreshTrigger, t]);
	
	return {
		brokerAccountSecurities,
		isBrokerAccountSecuritiesLoading,
		error,
		reloadBrokerAccountSecurities
	};
};
