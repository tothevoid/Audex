import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrokerAccountSecurityEntity } from "@/models/brokers/BrokerAccountSecurityEntity";
import { getSecuritiesByBrokerAccount } from "@/api/brokers/brokerAccountSecurityApi";
import { Nullable } from "@/shared/utilities/nullable";
import { parseErrorMessage } from "@/shared/utilities/webApiUtilities";

export interface BrokerAccountSecuritiesQuery {
	brokerAccountId: Nullable<string>
}

export const useBrokerAccountsSecurities = (queryParameters: BrokerAccountSecuritiesQuery) => {
	const { t } = useTranslation();
	const [brokerAccountSecurities, setBrokerAccountSecurities] = useState<BrokerAccountSecurityEntity[]>([]);
	const [isBrokerAccountSecuritiesLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);
	const [brokerAccountSecurityQueryParameters, setBrokerAccountSecurityQueryParameters] = useState<BrokerAccountSecuritiesQuery>(queryParameters);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const securities = await getSecuritiesByBrokerAccount(brokerAccountSecurityQueryParameters.brokerAccountId);
			setBrokerAccountSecurities(securities);
		} catch (err: unknown) {
			setError(parseErrorMessage(err, t("error_data_load")));
		} finally {
			setLoading(false);
		}
	}, [brokerAccountSecurityQueryParameters, t]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);
	
	return {
		brokerAccountSecurities,
		isBrokerAccountSecuritiesLoading,
		error,
		setBrokerAccountSecurityQueryParameters,
		brokerAccountSecurityQueryParameters,
		reloadBrokerAccountSecurities: fetchData
	};
};
