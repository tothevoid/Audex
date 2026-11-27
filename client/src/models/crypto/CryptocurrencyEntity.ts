import { BaseEntity } from "@/models/common/BaseEntity";

export interface CryptocurrencyEntity extends BaseEntity {
    name: string;
    symbol: string;
    price: number;
    iconKey: string;
}
