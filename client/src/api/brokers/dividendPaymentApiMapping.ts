import { DividendPaymentEntityResponse, DividendPaymentEntity, DividendPaymentEntityRequest } from "@/models/brokers/DividendPaymentEntity";
import { convertToDateOnly } from "@/shared/utilities/dateUtils";
import { prepareDividend } from "@/api/securities/dividendApiMapping";
import { prepareBrokerAccount } from "./brokerAccountApiMapping";

export const prepareDividendPaymentRequest = (dividendPayment: DividendPaymentEntity): DividendPaymentEntityRequest => {
    return {
        id: dividendPayment.id,
        brokerAccountId: dividendPayment.brokerAccount.id,
        dividendId: dividendPayment.dividend.id,
        securitiesQuantity: dividendPayment.securitiesQuantity,
        tax: dividendPayment.tax,
        receivedAt: convertToDateOnly(dividendPayment.receivedAt) 
    };
};

export const prepareDividendPayment = (dividendPayment: DividendPaymentEntityResponse): DividendPaymentEntity => {
    return {
        id: dividendPayment.id,
        dividend: prepareDividend(dividendPayment.dividend),
        securitiesQuantity: dividendPayment.securitiesQuantity,
        tax: dividendPayment.tax,
        brokerAccount: prepareBrokerAccount(dividendPayment.brokerAccount),
        receivedAt: new Date(dividendPayment.receivedAt)
    };
};