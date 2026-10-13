import React, { Fragment } from 'react';
import { SimpleGrid } from '@chakra-ui/react';
import BrokerAccountSecurity from '@/pages/BrokerAccount/components/BrokerAccountSecurity/BrokerAccountSecurity';
import { BrokerAccountSecurityEntity } from '@/models/brokers/BrokerAccountSecurityEntity';
import { useBrokerAccountsSecurities } from '@/pages/BrokerAccount/hooks/useBrokerAccountsSecurities';
import { Nullable } from '@/shared/utilities/nullable';

interface Props {
	mainCurrencyAmount?: number;
	mainCurrencyName?: string;
	brokerAccountId?: Nullable<string>;
	refreshTrigger?: number;
}

const BrokerAccountSecuritiesList: React.FC<Props> = ({ brokerAccountId, refreshTrigger }) => {
	const { brokerAccountSecurities } = useBrokerAccountsSecurities(brokerAccountId, refreshTrigger);

	if (!brokerAccountSecurities || brokerAccountSecurities.length === 0) {
		return <Fragment />;
	}

	return (
		<Fragment>
			<SimpleGrid pb={5} gap={4} templateColumns='repeat(auto-fill, minmax(350px, 3fr))'>
				{
					brokerAccountSecurities.map((brokerAccountSecurity: BrokerAccountSecurityEntity) => 
						<BrokerAccountSecurity 
							key={brokerAccountSecurity.id}
							brokerAccountSecurity={brokerAccountSecurity}  
						/>)
				}
			</SimpleGrid>
		</Fragment>
	);
};

export default BrokerAccountSecuritiesList;