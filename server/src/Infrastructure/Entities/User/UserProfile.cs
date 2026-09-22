using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Audex.Infrastructure.Entities.Currencies;
using Audex.Shared.Entities;

namespace Audex.Infrastructure.Entities.User
{
    public class UserProfile: BaseEntity
    {
        public string UserName { get; set; }

        public string Password { get; set; }

        public Guid CurrencyId { get; set; }

        public Currency Currency { get; set; }

        public string LanguageCode { get; set; }

        public string TimeZoneId { get; set; } = "Europe/Moscow";
    }
}
