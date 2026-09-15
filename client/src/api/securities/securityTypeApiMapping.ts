import { SecurityTypeEntity } from "../../models/securities/SecurityTypeEntity";
import { getSecurityTypeLabel } from "../../shared/utilities/formatters/securityTypeFormatter";

export const prepareSecurityType = (type: SecurityTypeEntity): SecurityTypeEntity => {
    if (!type) return type;
    return {
        ...type,
        name: getSecurityTypeLabel(type) || type.name
    };
};
