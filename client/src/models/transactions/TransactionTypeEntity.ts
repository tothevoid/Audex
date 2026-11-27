import { BaseEntity } from "@/models/common/BaseEntity";

export interface TransactionTypeEntity extends BaseEntity {
    name: string;
    active: boolean;
    iconKey: string;
}
