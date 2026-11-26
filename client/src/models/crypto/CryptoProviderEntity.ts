import { Nullable } from "@/shared/utilities/nullable";

export interface CryptoProviderEntity {
    id: string;
    name: string;
    active: boolean;
    iconKey?: Nullable<string>;
}