using System;

namespace Audex.Application.Integrations.Stock.Moex.Model
{
    public class MarketDataRow
    {
        public string Ticker { get; set; }

        public string BoardId { get; set; }

        public decimal? LastValue { get; set; }

        public DateTime Date { get; set; }

        public decimal? MarketPrice { get; set; }

        public decimal? Open { get; set; }

        public decimal Low { get; set; }

        public decimal High { get; set; }

        public decimal? PrevPrice { get; set; }

        public string GetUniqueKey()
        {
            return $"{Ticker}_{BoardId}";
        }

        public decimal GetLastValue()
        {
            // if security has no liquidity, LastValue can be null, then we use MarketPrice
            return LastValue ?? MarketPrice ?? 0;
        }

        public int BoardPriority => MoexBoardPriorities.GetPriority(BoardId);
    }
}
