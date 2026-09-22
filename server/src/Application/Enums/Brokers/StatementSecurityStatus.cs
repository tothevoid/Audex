namespace Audex.Application.Enums.Brokers
{
    public enum StatementSecurityStatus
    {
        ExistingInDatabase = 1,
        CanBeCreatedFromMarket = 2,
        NotFoundInMarket = 3
    }
}
