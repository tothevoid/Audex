import { Nullable } from "@/shared/utilities/nullable";

export interface CryptoProviderEntity {
    id: string;
    name: string;
    iconKey?: Nullable<string>;
}