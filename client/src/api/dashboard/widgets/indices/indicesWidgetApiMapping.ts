import {
    IndicesWidgetEntity,
    IndicesWidgetResponse,
    MarketIndexQuoteEntity,
    MarketIndexQuoteResponse
} from "@/models/dashboard/widgets/indices/IndicesWidgetEntity";

export const mapMarketIndexQuote = (response: MarketIndexQuoteResponse): MarketIndexQuoteEntity => ({
    code: response.code,
    name: response.name,
    shortName: response.shortName,
    value: response.value,
    changePoints: response.changePoints,
    changePercent: response.changePercent,
    currency: response.currency,
    decimals: response.decimals ?? 2,
    source: response.source ?? "",
    lastUpdateTime: response.lastUpdateTime ? new Date(response.lastUpdateTime) : null
});

export const mapIndicesWidget = (response: IndicesWidgetResponse): IndicesWidgetEntity => ({
    indices: (response?.indices ?? []).map(mapMarketIndexQuote)
});
