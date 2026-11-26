import { Nullable } from "@/shared/utilities/nullable";

export interface BankEntity {
    id: string,
    name: string,
    active: boolean,
    iconKey: Nullable<string>
}