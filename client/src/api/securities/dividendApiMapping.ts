import { DividendEntity, DividendEntityRequest, DividendEntityResponse } from "@/models/securities/DividendEntity";
import { convertToDateOnly } from "@/shared/utilities/dateUtils";
import { prepareSecurity } from "./securityApiMapping";

export const prepareDividendRequest = (dividend: DividendEntity): DividendEntityRequest => {
    return {
        id: dividend.id,
        declarationDate: convertToDateOnly(dividend.declarationDate),
        snapshotDate: convertToDateOnly(dividend.snapshotDate),
        securityId: dividend.security.id,
        amount: dividend.amount
    };
}

export const prepareDividend = (dividend: DividendEntityResponse): DividendEntity => {
    return {
        id: dividend.id,
        amount: dividend.amount,
        security: prepareSecurity(dividend.security),
        declarationDate: new Date(dividend.declarationDate),
        snapshotDate: new Date(dividend.snapshotDate)
    };
}