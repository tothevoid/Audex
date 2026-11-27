import { BaseEntity } from "@/models/common/BaseEntity";

export interface BrokerAccountTypeEntity extends BaseEntity {
    name: string;
    active: boolean;
}