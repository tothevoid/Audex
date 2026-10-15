import { Nullable } from "@/shared/utilities/nullable";

export interface BrokerAccountPortfolioDateBoundsEntity {
    minDate: Nullable<Date>;
    maxDate: Nullable<Date>;
}

export interface BrokerAccountPortfolioDateBoundsEntityResponse {
    minDate: Nullable<string>;
    maxDate: Nullable<string>;
}
