import {
    OilQuoteEntity,
    OilQuoteResponse,
    OilWidgetEntity,
    OilWidgetResponse
} from "@/models/dashboard/widgets/oil/OilWidgetEntity";

export const mapOilQuote = (response: OilQuoteResponse): OilQuoteEntity => ({
    symbol: response.symbol,
    price: response.price,
    change: response.change,
    changePercent: response.changePercent,
    currency: response.currency,
    source: response.source ?? "",
    lastTradeTime: new Date(response.lastTradeTime)
});

export const mapOilWidget = (response: OilWidgetResponse): OilWidgetEntity => ({
    quotes: (response?.quotes ?? []).map(mapOilQuote)
});
