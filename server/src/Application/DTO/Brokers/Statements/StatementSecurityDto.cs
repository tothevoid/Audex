#nullable enable
using System;
using Audex.Application.Enums.Brokers;

namespace Audex.Application.DTO.Brokers.Statements
{
    public class StatementSecurityDto
    {
        public string? Isin { get; set; }

        public string Ticker { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public StatementSecurityStatus Status { get; set; }

        public Guid? ResolvedSecurityId { get; set; }

        public static StatementSecurityDto ExistingInDatabase(Guid id, string name, string ticker, string? isin)
        {
            return new StatementSecurityDto
            {
                ResolvedSecurityId = id,
                Name = name,
                Ticker = ticker,
                Isin = isin,
                Status = StatementSecurityStatus.ExistingInDatabase
            };
        }

        public static StatementSecurityDto CanBeCreatedFromMarket(string name, string ticker, string? isin)
        {
            return new StatementSecurityDto
            {
                ResolvedSecurityId = null,
                Name = name,
                Ticker = ticker,
                Isin = isin,
                Status = StatementSecurityStatus.CanBeCreatedFromMarket
            };
        }

        public static StatementSecurityDto NotFoundInMarket(string name, string? ticker, string? isin)
        {
            return new StatementSecurityDto
            {
                ResolvedSecurityId = null,
                Name = name,
                Ticker = ticker ?? isin ?? string.Empty,
                Isin = isin,
                Status = StatementSecurityStatus.NotFoundInMarket
            };
        }
    }
}
