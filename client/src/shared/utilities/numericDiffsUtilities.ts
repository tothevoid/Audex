import { formatMoneyByCurrencyCulture } from "./formatters/moneyFormatter";
import { Nullable } from "./nullable";

export const  getDiffColor = (profitAndLoss: number): string => {
    if (profitAndLoss > 0) return "green.600";
    if (profitAndLoss < 0) return "red.600";
    return "text_primary";
};

export const calculateDiff = (currentValue: number, initialValue: number, currency: Nullable<string> = null) => {
    const profitAndLoss = currentValue - initialValue;
    const profitAndLossPercentage = initialValue ? 
        profitAndLoss / initialValue * 100:
        0;

    const color = getDiffColor(profitAndLoss);

    const formattedProfitAndLoss = currency ?
        formatMoneyByCurrencyCulture(profitAndLoss, currency):
        profitAndLoss.toFixed(2);

    return {
        profitAndLoss: formattedProfitAndLoss, 
        profitAndLossPercentage: profitAndLossPercentage.toFixed(2),
        rawProfitAndLoss: profitAndLoss,
        color
    };
};
