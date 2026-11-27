import { BaseEntity } from "@/models/common/BaseEntity";

export interface CurrencyEntity extends BaseEntity {
    name: string;
    active: boolean;
    rate: number;
}
