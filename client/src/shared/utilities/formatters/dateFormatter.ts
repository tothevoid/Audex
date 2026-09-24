import { i18n } from "i18next";

export const formatTime = (date: Date, format: i18n) => {
	return new Intl.DateTimeFormat(format.language, {
		hour: "2-digit",
		minute: "2-digit"
	}).format(date);
};

export const formatTimeWithSeconds = (date: Date, format: i18n) => {
	return new Intl.DateTimeFormat(format.language, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	}).format(date);
};


export const formatDate = (date: Date, format: i18n, showYear: boolean = true,) => {
	return new Intl.DateTimeFormat(format.language, {
		year: showYear ? "numeric" : undefined,
		month: "long",
		day: "numeric"
	}).format(date);
};

export const formatDateTime = (date: Date, format: i18n, showYear: boolean = true) => {
	return new Intl.DateTimeFormat(format.language, {
		year: showYear ? "numeric" : undefined,
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	}).format(date);
};

export const formatShortDateTime = (date: Date, format: i18n, showYear: boolean = true) => {
	return new Intl.DateTimeFormat(format.language, {
		year: showYear ? "2-digit" : undefined,
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit"
	}).format(date);
};

export const formatNumericDate = (date: Date, format: i18n, showYear: boolean = true) => {
	return new Intl.DateTimeFormat(format.language, {
		year: showYear ? "2-digit" : undefined,
		month: "numeric",
		day: "numeric"
	}).format(date);
};

export const formatMonthYear = (month: number, year: number) => {
	return `${month.toString().padStart(2, "0")}-${year}`
}

export const formatMonthYearByDate = (date: Date) => {
	return formatMonthYear(date.getMonth() + 1, date.getFullYear())
}

export const formatMonth = (month: number, format: i18n): string => {
	const date = new Date();
	date.setMonth(month - 1);
	return date.toLocaleString(format.language, { month: 'long' });
}

export type ChartPeriod = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "10Y";

export const formatChartAxisDate = (date: Date, period: ChartPeriod, format: i18n): string => {
	const lang = format?.language || "en";
	if (period === "1D") {
		return new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit" }).format(date);
	}
	if (period === "1W" || period === "1M" || period === "3M") {
		return new Intl.DateTimeFormat(lang, { day: "numeric", month: "short" }).format(date);
	}
	if (period === "6M" || period === "1Y") {
		return new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", year: "2-digit" }).format(date);
	}
	return new Intl.DateTimeFormat(lang, { month: "short", year: "numeric" }).format(date);
};

export const formatChartTooltipDate = (date: Date, period: ChartPeriod, format: i18n): string => {
	const lang = format?.language || "en";
	if (period === "1D" || period === "1W") {
		return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
	}
	return formatDate(date, format);
};