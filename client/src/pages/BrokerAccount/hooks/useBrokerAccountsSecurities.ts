import { useCallback, useEffect, useState } from "react";
import { BrokerAccountSecurityEntity } from "@/models/brokers/BrokerAccountSecurityEntity";
import { getSecuritiesByBrokerAccount } from "@/api/brokers/brokerAccountSecurityApi";
import { Nullable } from "@/shared/utilities/nullable";

export interface BrokerAccountSecuritiesQuery {
	brokerAccountId: Nullable<string>
}

export const useBrokerAccountsSecurities = (queryParameters: BrokerAccountSecuritiesQuery) => {
	const [brokerAccountSecurities, setBrokerAccountSecurities] = useState<BrokerAccountSecurityEntity[]>([]);
	const [isBrokerAccountSecuritiesLoading, setLoading] = useState(false);

	const [error, setError] = useState<string | null>(null);
	const [brokerAccountSecurityQueryParameters, setBrokerAccountSecurityQueryParameters] = useState<BrokerAccountSecuritiesQuery>(queryParameters);

	const fetchData = useCallback(async () => {
		setLoading(true)
		try {
			const securities = await getSecuritiesByBrokerAccount(brokerAccountSecurityQueryParameters.brokerAccountId);
			setBrokerAccountSecurities(securities);
		} catch (err: any) {
			setError(err.message || 'Ошибка загрузки данных')
		} finally {
			setLoading(false)
		}
	}, [brokerAccountSecurityQueryParameters])

	useEffect(() => {
		fetchData();
	}, [fetchData])
	
	return {
		brokerAccountSecurities,
		isBrokerAccountSecuritiesLoading,
		error,
		setBrokerAccountSecurityQueryParameters,
		brokerAccountSecurityQueryParameters,
		reloadBrokerAccountSecurities: fetchData
	}
}
