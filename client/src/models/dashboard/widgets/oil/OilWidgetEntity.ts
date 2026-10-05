export interface OilQuoteResponse {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    source: string;
    lastTradeTime: string;
}

export interface OilWidgetResponse {
    quotes: OilQuoteResponse[];
}

export interface OilQuoteEntity {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    source: string;
    lastTradeTime: Date;
}

export interface OilWidgetEntity {
    quotes: OilQuoteEntity[];
}

export interface OilWidgetSettings {
    symbols?: string[];
}
