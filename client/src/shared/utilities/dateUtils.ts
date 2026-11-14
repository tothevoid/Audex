import { i18n } from "i18next";

const pad = (n: number) => n.toString().padStart(2, "0");

export const getDateParts = (date: Date = new Date()) => ({
    year: date.getFullYear().toString(),
    yearShort: date.getFullYear().toString().slice(-2),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
    hours: pad(date.getHours()),
    minutes: pad(date.getMinutes()),
    seconds: pad(date.getSeconds()),
});

export const getMonthByIndex = (index?: number | null, i18n?: i18n, isShort = false): string => {
    if (!index || index < 1 || index > 12 || !i18n) {
        return "";
    }
    return getMonthsNames(i18n, isShort)[index - 1];
};

export const convertToDateOnly = (date: Date | string): string => {
    if (!date) {
        return "";
    }

    const parsedDate = date instanceof Date ? date : new Date(date);
    if (isNaN(parsedDate.getTime())) {
        return String(date);
    }

    const { year, month, day } = getDateParts(parsedDate);
    return `${year}-${month}-${day}`;
};

export const parseIsoDateOnly = (dateString?: string | null): Date | null => {
    if (!dateString) {
        return null;
    }
    const parts = dateString.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
        return null;
    }
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
};

export const getMonthsNames = (i18n: i18n, isShort = true): string[] => {
    const formatter = new Intl.DateTimeFormat(i18n.language, { month: 'long' });

    return Array.from({ length: 12 }, (_, monthIndex) => {
        const fullMonthName = formatter.format(new Date(2000, monthIndex, 1));
        const capitalizedMonthName = fullMonthName.charAt(0).toUpperCase() + fullMonthName.slice(1);
        return isShort ? capitalizedMonthName.slice(0, 3) : capitalizedMonthName;
    });
};

export const getCurrentDate = (): string => {
    const date = new Date();
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().substr(0, 10);
};

export const formatTimestampForReport = (date: Date = new Date()): string => {
    const { hours, minutes, day, month, yearShort } = getDateParts(date);
    return `${hours}-${minutes}_${day}-${month}-${yearShort}`;
};

export const formatTimestampForBackup = (date: Date = new Date()): string => {
    const { year, month, day, hours, minutes, seconds } = getDateParts(date);
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};