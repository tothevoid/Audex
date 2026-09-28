import { Nullable } from "@/shared/utilities/nullable";

export enum Currency {
	RUB = 0,
	USD = 1,
	EUR = 2
}

const currencyMapping = new Map<Currency, string>([
	[Currency.RUB, "RUB"],
	[Currency.USD, "USD"],
	[Currency.EUR, "EUR"]
]);

export const formatMoney = (value: number, currency: Currency = Currency.RUB) => {
	return new Intl.NumberFormat("ru-RU", {
		style: "currency",
		currency: currencyMapping.get(currency),
		minimumFractionDigits: 2,
	}).format(value);
  };


export const formatMoneyByCurrencyCulture = (value: number, currency: Nullable<string>, digits: number = 2) => {
	if (!currency) {
		return value.toString();
	}

  	return new Intl.NumberFormat("ru-RU", {
		style: "currency",
		currency: currency,
		minimumFractionDigits: digits,
	}).format(value);
};