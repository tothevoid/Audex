#nullable enable
using Audex.Infrastructure.Interfaces.Database;
using System.Linq;
using System;
using System.Threading.Tasks;
using Audex.Application.DTO.User;
using Audex.Application.Enums.Auth;
using Audex.Application.Interfaces.Auth;
using Audex.Application.Interfaces.User;
using Audex.Application.Mappings;
using Audex.Infrastructure.Entities.User;
using Microsoft.EntityFrameworkCore;
using Audex.Application.Interfaces.Currencies;
using Audex.Application.Services.Currencies;

namespace Audex.Application.Services.User
{
    public class UserProfileService : IUserProfileService
    {
        private readonly IUnitOfWork _db;
        private readonly IRepository<UserProfile> _userProfileRepo;
        private readonly ApplicationMapper _mapper;
        private readonly ICurrencyService _currencyService;
        private readonly IPasswordHasherService _passwordHasher;

        public UserProfileService(
            IUnitOfWork uow,
            ApplicationMapper mapper,
            ICurrencyService currencyService,
            IPasswordHasherService passwordHasher)
        {
            _db = uow;
            _mapper = mapper;
            _userProfileRepo = uow.CreateRepository<UserProfile>();
            _currencyService = currencyService;
            _passwordHasher = passwordHasher;
        }

        public async Task<UserProfileDto?> GetAsync()
        {
            var users = await _userProfileRepo.GetAllAsync(include: GetFullHierarchyColumns);
            return _mapper.Map(users.FirstOrDefault());
        }

        public async Task<UserProfileDto?> GetByUserNameAsync(string userName)
        {
            var user = await GetUserEntityByUserNameAsync(userName, disableTracking: true);
            return _mapper.Map(user);
        }

        public async Task<UserProfileDto?> GetByAuthAsync(string userName, string password)
        {
            var user = await GetUserEntityByUserNameAsync(userName, disableTracking: false);
            if (user == null)
            {
                return null;
            }

            var verificationResult = _passwordHasher.VerifyHashedPassword(user.Password, password);
            if (verificationResult == PasswordVerificationResult.Failed)
            {
                return null;
            }

            if (verificationResult == PasswordVerificationResult.SuccessRehashNeeded && !string.IsNullOrEmpty(password))
            {
                // Lazy migration: upgrade plain-text password to Argon2id hash upon successful authentication
                user.Password = _passwordHasher.HashPassword(password);
                _userProfileRepo.Update(user);
                await _db.CommitAsync();
            }

            return _mapper.Map(user);
        }

        private async Task<UserProfile?> GetUserEntityByUserNameAsync(string userName, bool disableTracking = true)
        {
            var users = await _userProfileRepo.GetAllAsync(
                user => string.Equals(user.UserName, userName),
                include: GetFullHierarchyColumns,
                disableTracking: disableTracking);

            return users.FirstOrDefault();
        }

        public async Task UpdateAsync(UserProfileDto newUserStateDto)
        {
            var existingUser = !string.IsNullOrEmpty(newUserStateDto.UserName)
                ? await GetUserEntityByUserNameAsync(newUserStateDto.UserName, disableTracking: false)
                : (await _userProfileRepo.GetAllAsync(include: GetFullHierarchyColumns, disableTracking: false)).FirstOrDefault();

            if (existingUser == null)
            {
                return;
            }

            var currencyChanged = newUserStateDto.CurrencyId != Guid.Empty && existingUser.CurrencyId != newUserStateDto.CurrencyId;

            if (!string.IsNullOrEmpty(newUserStateDto.LanguageCode))
            {
                existingUser.LanguageCode = newUserStateDto.LanguageCode;
            }

            if (newUserStateDto.CurrencyId != Guid.Empty)
            {
                existingUser.CurrencyId = newUserStateDto.CurrencyId;
            }

            _userProfileRepo.Update(existingUser);
            await _db.CommitAsync();

            if (currencyChanged)
            {
                var currency = await _currencyService.GetByIdAsync(newUserStateDto.CurrencyId);
                if (currency != null)
                {
                    await _currencyService.SyncRatesAsync(currency);
                }
            }
        }

        public async Task UpdatePasswordAsync(Guid userId, string hashedPassword)
        {
            var user = await _userProfileRepo.GetByIdAsync(userId, disableTracking: false);
            if (user == null)
            {
                return;
            }

            user.Password = hashedPassword;
            _userProfileRepo.Update(user);
            await _db.CommitAsync();
        }

        private IQueryable<UserProfile> GetFullHierarchyColumns(IQueryable<UserProfile> userProfileQuery)
        {
            return userProfileQuery.Include(profile => profile.Currency);
        }
    }
}