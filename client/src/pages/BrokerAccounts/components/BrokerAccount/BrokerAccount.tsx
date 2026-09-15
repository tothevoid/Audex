import { Card, Flex, Link, Span, Stack, Text } from '@chakra-ui/react';
import { Fragment, useEffect, useState } from 'react';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { BrokerAccountEntity } from '../../../../models/brokers/BrokerAccountEntity';
import { getBankIconUrl } from '../../../../api/banks/bankApi';
import { getPortfolioValues } from '../../../../api/brokers/brokerAccountSummaryApi';
import { BrokerAccountPortfolioEntity } from '../../../../models/brokers/BrokerAccountPortfolioEntity';
import { BsBank } from 'react-icons/bs';
import StoredIcon from '../../../../shared/components/StoredIcon';
import CardActionButtons from '../../../../shared/components/CardActionButtons/CardActionButtons';
import EntityCard from '../../../../shared/components/EntityCard/EntityCard';

interface Props {
	brokerAccount: BrokerAccountEntity
	onEditClick: (account: BrokerAccountEntity) => void
	onDeleteClick: (account: BrokerAccountEntity) => void
}

const BrokerAccount = (props: Props) => {
	const { id, name, broker, currency, type, bank } = props.brokerAccount;

	const [portfolio, setPortfolio] = useState<BrokerAccountPortfolioEntity | null>(null);

	useEffect(() => {
		const fetchPortfolioValues = async () => {
			const values = await getPortfolioValues(id)
			if (values) {
				setPortfolio(values);
			}
		}

		fetchPortfolioValues()
	}, [id]);

	const accountLink = `../broker_account/${id}`;

	if (!portfolio) {
		return <Fragment/>
	}

	const color = portfolio.profitAndLoss >= 0 ? "gain": "loss";
	const bankIconUrl = bank?.iconKey ? getBankIconUrl(bank.iconKey) : undefined;

	return <Fragment>
		<EntityCard>
			<Card.Body color="text_primary" p={4}>
				<Flex justifyContent="space-between" alignItems="center">
					<Stack>
						<Flex gapX={2} alignItems={"center"}>
							<StoredIcon
								src={bankIconUrl}
								fallbackIcon={<BsBank size={16} color="#aaa" />}
								size="sm"
							/>
							<Link fontSize="2xl" fontWeight={900} color="text_primary" href={accountLink}>{name}</Link>
						</Flex>
						<Text fontWeight={600}>{broker.name}</Text>
						<Text fontWeight={600}>{type.name}</Text>
						<Stack gapX={1} direction="row">
							<Span>{formatMoneyByCurrencyCulture(portfolio?.currentAmount, currency.name)}</Span>
							<Span color={color}>({formatMoneyByCurrencyCulture(portfolio.profitAndLoss, currency.name)})</Span>
						</Stack>
					</Stack>
					<CardActionButtons
						size="sm"
						onEdit={() => props.onEditClick(props.brokerAccount)}
						onDelete={() => props.onDeleteClick(props.brokerAccount)}
					/>
				</Flex>
			</Card.Body>
		</EntityCard>
	</Fragment>
};

export default BrokerAccount;