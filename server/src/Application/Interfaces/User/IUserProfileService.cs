#nullable enable
using System;
using Audex.Application.DTO.User;
using System.Threading.Tasks;

namespace Audex.Application.Interfaces.User
{
    public interface IUserProfileService
    {
        Task<UserProfileDto?> GetAsync();

        Task<UserProfileDto?> GetByUserNameAsync(string userName);

        Task<UserProfileDto?> GetByAuthAsync(string userName, string password);

        Task UpdateAsync(UserProfileDto newUserStateDto);

        Task UpdatePasswordAsync(Guid userId, string hashedPassword);
    }
}
