using Audex.Infrastructure.Constants;
using Audex.Infrastructure.Entities.Securities;
using Audex.Infrastructure.Entities.User;
using Audex.Infrastructure.Interfaces.Utilitary;

namespace Audex.Infrastructure.Data
{
    public class UserProfileGenerator : IDataGenerator<UserProfile>
    {
        private const string DefaultLanguageCode = "EN";

        public UserProfile[] Generate()
        {
            return new UserProfile[]
            {
                new() 
                { 
                    Id = UserProfileConstants.UserProfileId, 
                    CurrencyId = CurrencyConstants.USD, 
                    LanguageCode = DefaultLanguageCode,
                    TimeZoneId = "Europe/Moscow",
                    UserName = "admin"
                }
            };
        }
    }
}