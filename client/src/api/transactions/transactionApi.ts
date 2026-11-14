import { createAndGetFullEntity, deleteEntity, getAllEntities, updateEntity } from '@/api/basicApi';
import { TransactionEntity, TransactionEntityRequest, TransactionEntityResponse } from '@/models/transactions/TransactionEntity';
import { GetTransactionsQuery } from '@/models/transactions/GetTransactionsQuery';
import { prepareTransaction, prepareTransactionRequest } from './transactionApiMapping';

const basicUrl = `Transaction`;

export const getTransactions = async (query: GetTransactionsQuery): Promise<TransactionEntity[]> => {
	return getAllEntities<TransactionEntityResponse, GetTransactionsQuery>(basicUrl, query)
		.then((transactionsResponses: TransactionEntityResponse[]) => transactionsResponses.map(prepareTransaction));
};

export const createTransaction = async (transaction: TransactionEntity): Promise<TransactionEntity | void> => {
	return await createAndGetFullEntity<TransactionEntityRequest, TransactionEntityResponse>(basicUrl, prepareTransactionRequest(transaction))
		.then(createdTransaction => createdTransaction && prepareTransaction(createdTransaction));
};

export const updateTransaction = async (modifiedTransaction: TransactionEntity): Promise<boolean> => {
	return await updateEntity<TransactionEntityRequest>(basicUrl, prepareTransactionRequest(modifiedTransaction));
};

export const deleteTransaction = async (transactionId: string): Promise<boolean> => {
	return await deleteEntity(basicUrl, transactionId);
};
