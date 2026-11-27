import { BaseEntity } from "@/models/common/BaseEntity";
import { Nullable } from "@/shared/utilities/nullable";

export interface BankEntity extends BaseEntity {
    name: string;
    active: boolean;
    iconKey: Nullable<string>;
}