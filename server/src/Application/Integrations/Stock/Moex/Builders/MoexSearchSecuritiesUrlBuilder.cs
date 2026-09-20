using System;

namespace Audex.Application.Integrations.Stock.Moex.Builders
{
    public class MoexSearchSecuritiesUrlBuilder : BaseMoexUrlBuilder
    {
        public MoexSearchSecuritiesUrlBuilder(string query)
        {
            AdditionalParameters.Add($"q={Uri.EscapeDataString(query.Trim())}");
        }

        protected override string GetUrl()
        {
            return $"{BaseUrl}/securities.json";
        }
    }
}
