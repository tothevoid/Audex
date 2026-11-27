import { BaseEntity } from "@/models/common/BaseEntity";

export interface AccountTypeEntity extends BaseEntity {
    name: string;
    active: boolean;
}
