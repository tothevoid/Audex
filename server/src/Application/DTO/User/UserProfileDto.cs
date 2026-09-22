using System;
using Audex.Application.DTO.Currencies;
using Audex.Shared.Entities;

namespace Audex.Application.DTO.User
{
    public class UserProfileDto : BaseEntity
    {
        public string UserName { get; set; }

        public string Password { get; set; }

        public Guid CurrencyId { get; set; }

        public CurrencyDto Currency { get; set; }

        public string LanguageCode { get; set; }

        public string TimeZoneId { get; set; } = "Europe/Moscow";
    }
}
