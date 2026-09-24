import { i18n as I18nInstance } from "i18next";
import { Nullable } from "../../../../shared/utilities/nullable";
import { formatShortDateTime } from "../../../../shared/utilities/formatters/dateFormatter";

export const formatTradeDate = (dateString: string, i18n: I18nInstance): string => {
    if (!dateString) {
        return "";
    }
    return formatShortDateTime(new Date(dateString), i18n, true);
};

export const formatDiffDate = (
    databaseDateString: Nullable<string> | undefined,
    statementDateString: string | undefined,
    i18n: I18nInstance
): string => {
    if (!databaseDateString || !statementDateString) {
        return "";
    }
    const databaseDate = new Date(databaseDateString);
    const statementDate = new Date(statementDateString);
    const isSameDay = databaseDate.toDateString() === statementDate.toDateString();

    if (isSameDay) {
        const timeFormat: Intl.DateTimeFormatOptions = {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        };
        const databaseTime = databaseDate.toLocaleTimeString(i18n.language, timeFormat);
        const statementTime = statementDate.toLocaleTimeString(i18n.language, timeFormat);
        return `${databaseTime} ➔ ${statementTime}`;
    }

    const formattedDatabaseDate = formatShortDateTime(databaseDate, i18n, true);
    const formattedStatementDate = formatShortDateTime(statementDate, i18n, true);
    return `${formattedDatabaseDate} ➔ ${formattedStatementDate}`;
};
