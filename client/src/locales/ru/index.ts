import commonGeneral from './common/general.json';
import commonModals from './common/modals.json';
import actions from './actions/actions.json';
import notifications from './common/notifications.json';
import accounts from './accounts/accounts.json';
import broker from './broker/broker.json';
import brokerTransfers from './broker/transfers.json';
import brokerTaxes from './broker/taxes.json';
import brokerStatements from './broker/statements.json';
import securities from './securities/securities.json';
import dividends from './securities/dividends.json';
import debts from './debts/debts.json';
import debtTags from './debts/tags.json';
import deposits from './deposits/deposits.json';
import crypto from './crypto/crypto.json';
import transactions from './transactions/transactions.json';
import currencyTransactions from './transactions/currency.json';
import data from './data/data.json';
import validation from './validation/validation.json';
import auth from './auth/auth.json';
import scheduler from './scheduler/scheduler.json';

const ru = {
    ...commonGeneral,
    ...commonModals,
    ...actions,
    ...notifications,
    ...accounts,
    ...broker,
    ...brokerTransfers,
    ...brokerTaxes,
    ...brokerStatements,
    ...securities,
    ...dividends,
    ...debts,
    ...debtTags,
    ...deposits,
    ...crypto,
    ...transactions,
    ...currencyTransactions,
    ...data,
    ...validation,
    ...auth,
    ...scheduler
};

export default ru;
