import { BaseEntity } from "@/models/common/BaseEntity";

export interface BrokerEntity extends BaseEntity {
    name: string;
    active: boolean;
}