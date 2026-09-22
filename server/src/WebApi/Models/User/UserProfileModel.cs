using System;
using Audex.Shared.Entities;
using Audex.WebApi.Models.Currencies;

namespace Audex.WebApi.Models.User
{
    public class UserProfileModel: BaseEntity
    {
        public string UserName { get; set; }

        public Guid CurrencyId { get; set; }

        public CurrencyModel Currency { get; set; }

        public string LanguageCode { get; set; }

        public string TimeZoneId { get; set; }
    }
}
