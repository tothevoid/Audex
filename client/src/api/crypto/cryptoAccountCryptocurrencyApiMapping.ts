import { CryptoAccountCryptocurrencyEntityResponse, CryptoAccountCryptocurrencyEntity, CryptoAccountCryptocurrencyEntityRequest } from "@/models/crypto/CryptoAccountCryptocurrencyEntity";
import { prepareCryptoAccount } from "./cryptoAccountApiMapping";

export const prepareCryptoAccountCryptocurrencyRequest = (cryptoAccountCryptocurrency: CryptoAccountCryptocurrencyEntity): CryptoAccountCryptocurrencyEntityRequest => {
    return {
        id: cryptoAccountCryptocurrency.id,
        cryptoAccountId: cryptoAccountCryptocurrency.cryptoAccount.id,
        cryptocurrencyId: cryptoAccountCryptocurrency.cryptocurrency.id,
        quantity: cryptoAccountCryptocurrency.quantity
    };
}

export const prepareCryptoAccountCryptocurrency = (cryptoAccountCryptocurrency: CryptoAccountCryptocurrencyEntityResponse): CryptoAccountCryptocurrencyEntity => {
    return {
        id: cryptoAccountCryptocurrency.id,
        quantity: cryptoAccountCryptocurrency.quantity,
        cryptoAccount: prepareCryptoAccount(cryptoAccountCryptocurrency.cryptoAccount),
        cryptocurrency: cryptoAccountCryptocurrency.cryptocurrency 
    }
}