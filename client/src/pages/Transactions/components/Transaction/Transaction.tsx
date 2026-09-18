import React from 'react';
import { AccountEntity } from '../../../../models/accounts/AccountEntity';
import { MdOutlineArrowDownward, MdOutlineArrowUpward, MdEdit, MdOutlinePayment } from 'react-icons/md';
import { MdDelete } from "react-icons/md";
import { Flex, Stack, Card, CardBody, Text, Button, Icon } from '@chakra-ui/react';
import { formatMoneyByCurrencyCulture } from '../../../../shared/utilities/formatters/moneyFormatter';
import { TransactionEntity } from '../../../../models/transactions/TransactionEntity';
import { getTransactionTypeIconUrl } from '../../../../api/transactions/transactionTypeApi';
import StoredIcon from '../../../../shared/components/StoredIcon';

interface Props { 
	transaction: TransactionEntity
	accounts: AccountEntity[]
	onUpdateClicked: (updatedTransaction: TransactionEntity) => void
	onDeleteClicked: (transaction: TransactionEntity) => void
} 

const Transaction: React.FC<Props> = (props: Props) => {
	const {amount, transactionType, name, account} = props.transaction;
	const getTransactionDirectionIcon = () => {
		return props.transaction.amount > 0 ?
			<Icon rounded={16} size={"lg"} fontSize="32" background={'green.100'} color={'green.600'}>
				<MdOutlineArrowUpward/>
			</Icon>:
			<Icon rounded={16} size={"lg"} fontSize="32"  background={'red.100'} color={'red.600'}>
				<MdOutlineArrowDownward/>
			</Icon>
	}

	const iconUrl = transactionType.iconKey ? getTransactionTypeIconUrl(transactionType.iconKey) : undefined;

	return <Card.Root borderColor="border_primary" color="text_primary" backgroundColor="background_primary" 
		mt={5} mb={5} boxShadow={"sm"} _hover={{ boxShadow: "md" }}>
		<CardBody>
			<Flex justifyContent="space-between" alignItems="center">
				<Stack direction={'row'} alignItems="center">
					<StoredIcon
						src={iconUrl}
						fallbackIcon={<MdOutlinePayment size={20} color="var(--chakra-colors-text_secondary)" />}
						size="md"
					/>
					<Stack direction={"row"} ml={5}>
						<Text fontWeight={700}>{name}</Text>
						<Text>{account.name}</Text>
					</Stack>
				</Stack>
				<Flex gap={2} justifyContent="space-between" alignItems="center">
					{getTransactionDirectionIcon()}
					<Text width={150}>{formatMoneyByCurrencyCulture(amount, account.currency.name)}</Text>
					<Button background={'background_secondary'} size={'sm'} onClick={() => props.onUpdateClicked(props.transaction)}>
						<Icon color="card_action_icon_primary">
							<MdEdit/>
						</Icon>
					</Button>
					<Button background={'background_secondary'} size={'sm'} onClick={() => props.onDeleteClicked(props.transaction)}>
						<Icon color="card_action_icon_danger">
							<MdDelete/>
						</Icon>
					</Button>
				</Flex>
			</Flex>
		</CardBody>
	</Card.Root>
}

export default Transaction;