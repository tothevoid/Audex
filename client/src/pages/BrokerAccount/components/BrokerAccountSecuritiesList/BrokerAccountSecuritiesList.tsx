import { forwardRef, Fragment, useImperativeHandle } from 'react';
import { SimpleGrid } from '@chakra-ui/react';
import BrokerAccountSecurity from '../BrokerAccountSecurity/BrokerAccountSecurity';
import { BrokerAccountSecurityEntity } from '../../../../models/brokers/BrokerAccountSecurityEntity';
import { useBrokerAccountsSecurities } from '../../hooks/useBrokerAccountsSecurities';
import { Nullable } from '../../../../shared/utilities/nullable';

interface Props {
	mainCurrencyAmount?: number,
	mainCurrencyName?: string,
	brokerAccountId?: Nullable<string>
}

export interface BrokerAccountSecuritiesListRef {
	reloadData: () => Promise<void>
}

const BrokerAccountSecuritiesList = forwardRef<BrokerAccountSecuritiesListRef, Props>(({ brokerAccountId }, ref)=> {
	const { 
		brokerAccountSecurities,
		reloadBrokerAccountSecurities
	} = useBrokerAccountsSecurities({brokerAccountId: brokerAccountId});

	useImperativeHandle(ref, () => ({
		reloadData: reloadBrokerAccountSecurities,
	}));

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
});

export default BrokerAccountSecuritiesList;