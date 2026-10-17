#nullable enable

namespace Audex.Application.Integrations.Stock.Moex
{
    public static class MoexBoardPriorities
    {
        public const int DefaultPriority = 100;

        public static int GetPriority(string? boardId) => boardId switch
        {
            "TQBR" => 1,
            "TQTF" => 2,
            "CETS" => 2,
            "TQPI" => 3,
            "SMAL" => 4,
            "SPEQ" => 5,
            "EQRP" => 6,
            "EQOB" => 7,
            "TQOD" => 8,
            _ => DefaultPriority
        };
    }
}
