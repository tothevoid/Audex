import { i18n } from "i18next";
import { ChartPeriod } from "@/models/common/ChartPeriod";

export { ChartPeriod };

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

export const formatDateTimeWithSeconds = (date: Date, format: i18n, showYear: boolean = true) => {
	return new Intl.DateTimeFormat(format.language, {
		year: showYear ? "numeric" : undefined,
		month: "2-digit",
		day: "2-digit",
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
	return `${month.toString().padStart(2, "0")}-${year}`;
};

export const formatMonthYearByDate = (date: Date) => {
	return formatMonthYear(date.getMonth() + 1, date.getFullYear());
};

export const formatMonth = (month: number, format: i18n): string => {
	const date = new Date();
	date.setMonth(month - 1);
	return date.toLocaleString(format.language, { month: 'long' });
};

export const formatShortMonth = (month: number, format: i18n, year?: number): string => {
	const targetYear = year ?? new Date().getFullYear();
	return new Date(targetYear, month - 1, 1).toLocaleString(format.language, { month: 'short' });
};

export const ALL_CHART_PERIODS: readonly ChartPeriod[] = [
	ChartPeriod.Day1,
	ChartPeriod.Week1,
	ChartPeriod.Month1,
	ChartPeriod.Month3,
	ChartPeriod.Month6,
	ChartPeriod.Year1,
	ChartPeriod.Year5,
	ChartPeriod.Year10,
	ChartPeriod.All,
] as const;

export const formatChartAxisDate = (date: Date, period: ChartPeriod, format: i18n): string => {
	const lang = format?.language || "en";
	if (period === ChartPeriod.Day1) {
		return new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit" }).format(date);
	}
	if (period === ChartPeriod.Week1 || period === ChartPeriod.Month1 || period === ChartPeriod.Month3) {
		return new Intl.DateTimeFormat(lang, { day: "numeric", month: "short" }).format(date);
	}
	if (period === ChartPeriod.Month6 || period === ChartPeriod.Year1) {
		return new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", year: "2-digit" }).format(date);
	}
	return new Intl.DateTimeFormat(lang, { month: "short", year: "numeric" }).format(date);
};

export const formatChartTooltipDate = (date: Date, period: ChartPeriod, format: i18n): string => {
	const lang = format?.language || "en";
	if (period === ChartPeriod.Day1 || period === ChartPeriod.Week1) {
		return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
	}
	return formatDate(date, format);
};

export const formatAdaptiveDateTime = (date: Date | null | undefined, format: i18n): string => {
	if (!date || isNaN(date.getTime()) || date.getFullYear() <= 1970) {
		return "";
	}

	const now = new Date();
	const isToday =
		date.getDate() === now.getDate() &&
		date.getMonth() === now.getMonth() &&
		date.getFullYear() === now.getFullYear();

	if (isToday) {
		return formatTime(date, format);
	}

	return formatShortDateTime(date, format, false);
};

export const formatQuoteTime = formatAdaptiveDateTime;