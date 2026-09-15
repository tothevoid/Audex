import { AccountTypeEntity } from "../../models/accounts/AccountTypeEntity";
import { getAccountTypeLabel } from "../../shared/utilities/formatters/accountTypeFormatter";

export const prepareAccountType = (type: AccountTypeEntity): AccountTypeEntity => {
    if (!type) return type;
    return {
        ...type,
        name: getAccountTypeLabel(type) || type.name
    };
};
