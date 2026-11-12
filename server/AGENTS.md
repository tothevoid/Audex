# Server (Backend) Development Guidelines for Audex

These guidelines apply to all backend code under `server/` and extend the root [AGENTS.md](../AGENTS.md).

---

## 🛠️ Stack & Solution Structure
- **Framework**: .NET 10 Web API
- **Layering**:
  - `server/src/WebApi`: ASP.NET Core Controllers and DTO models. Keep controllers thin; delegate logic to application services.
  - `server/src/Application`: Business logic, services (`Audex.Application.Services`), interfaces (`Audex.Application.Interfaces`), and DTOs (`Audex.Application.DTO`).
  - `server/src/Infrastructure`: EF Core DbContext, entity configurations, and migrations.
  - `server/src/Shared`: Common constants and helper models.
  - `server/tests/Application.Tests`: Unit tests for application services (`Audex.Application.Tests`).
  - `server/tests/Infrastructure.Tests`: Tests for infrastructure components (`Audex.Infrastructure.Tests`).
  - `server/tests/Tests.Shared`: Shared fixtures and test helpers (`Audex.Tests.Shared`).
- **Orphan Directory Prohibition**: Do NOT create or restore legacy directories (`server/BLL`, `server/DAL`, `server/Common`, `server/MoneyManager`, `server/server`, or folders outside `server/src/` and `server/tests/`). Only project folders declared in `Audex.slnx` are valid.

---

## 📝 Naming & Async Conventions
- **DTO Naming (`*Dto`)**: All DTO classes and files MUST use PascalCase with the `Dto` suffix (e.g. `AccountDto.cs`, `SecurityTransactionDto.cs`, `UserProfileDto.cs`). Do NOT use `*DTO`.
- **Mandatory `*Async` Suffix**: ALL asynchronous methods returning `Task` or `Task<T>` across all server layers MUST end with `Async`:
  - **Infrastructure**: `AddAsync`, `GetByIdAsync`, `GetAllAsync`, `GroupAsync`, `GetCountAsync`, `FindAsync`, `DeleteAsync`, `GetMinAsync`, `GetMaxAsync`, `GetSumAsync`, `SaveChangesAsync`, `CommitAsync`, `SendToAllAsync`.
  - **Application Services**: `AddAsync`, `GetByIdAsync`, `GetAllAsync`, `GetPaginationAsync`, `UpdateAsync`, `DeleteAsync`, `GetSummaryAsync`, etc.
  - **Integrations & Jobs**: `GetCandlesAsync`, `PullRatesAsync`, `PullQuotationsAsync`, `CleanUpOldNotificationsAsync`.
  - **WebApi Controllers**: Await the corresponding `*Async` service methods.

---

## 🗄️ EF Core & Service Layer Performance
- **BaseEntity & Keys**: ALL database entities in `server/src/Infrastructure/Entities` (including join and lookup tables) MUST inherit from `BaseEntity` (`Guid Id` PK). Do NOT define composite keys or explicit `builder.HasKey(...)` in configurations. Explicitly assign `Id = Guid.NewGuid()` when instantiating entities or join entities in services.
- **Navigation Includes (`GetFullHierarchyColumns`)**: Encapsulate `.Include()` / `.ThenInclude()` chains inside a private `GetFullHierarchyColumns(IQueryable<TEntity> query)` helper passed to `GetAllAsync` and `GetByIdAsync`.
- **Differential Join Entity Sync**: When updating collections (e.g. `debt.DebtTags`), NEVER `.Clear()` and re-add all items. Remove only missing target IDs and insert only newly added IDs to avoid `DbUpdateConcurrencyException` and redundant DB writes.
- **Read Queries**: All read-only queries MUST use `.AsNoTracking()`.
- **Batch Async Execution**: Avoid sequential `await` inside `foreach` loops for multi-account computations; use `Task.WhenAll` or aggregated SQL queries.
- **Direct Bulk Deletes**: Prefer EF Core `ExecuteDeleteAsync()` for primary-key deletions instead of fetching detached entities first.
- **Repository Scope Restriction**: `IRepository<TEntity>` and `unitOfWork.CreateRepository<TEntity>()` are strictly prohibited in composite, calculating, reporting, or aggregation services (e.g. `BrokerAccountPortfolioHistoryService`, `DashboardService`, report generators). Repositories and `IUnitOfWork` may ONLY be used inside the dedicated primary domain service for that entity. Composite services MUST delegate to domain services via their interfaces.

---

## 🔄 Infrastructure Model Changes & Migrations
- **Mandatory User Confirmation**: NEVER modify entities, models, or configurations in `server/src/Infrastructure` (`Entities/`, `Configurations/`, `ApplicationDbContext.cs`) without first presenting the proposed schema changes and obtaining explicit user confirmation.
- **Uncommitted Migration Re-generation Workflow** (when approved and current migration is not committed):
  1. Roll back DB: `dotnet ef database update <PreviousMigrationName> --project src/Infrastructure --startup-project src/WebApi`
  2. Remove uncommitted migration: `dotnet ef migrations remove --project src/Infrastructure --startup-project src/WebApi`
  3. Apply approved entity modifications.
  4. Generate migration: `dotnet ef migrations add <MigrationName> --project src/Infrastructure --startup-project src/WebApi`
  5. Apply migration: `dotnet ef database update --project src/Infrastructure --startup-project src/WebApi`

---

## 🌐 API Controllers & Operation Results
- **Date Parameters**: Use `DateOnly` (`YYYY-MM-DD`) for API query parameters.
- **No Unused Parameters**: Controller signatures MUST NOT accept parameters not forwarded to services.
- **Dual Endpoints**: When `brokerAccountId` is optional/nullable, provide both `GetAll(...)` (aggregate) and `GetByBrokerAccount(..., Guid brokerAccountId)` (single account).
- **Error Responses**: Exceptions return RFC 7807 `ProblemDetails`.
- **Operation Result Pattern (`OperationResultDto<T>`)**: For mutations with business validation or domain conflicts (e.g. ticker uniqueness), return `OperationResultDto<T>` (`IsSuccess`, `Data`, `ErrorMessage`) instead of throwing raw exceptions, retrieving localized messages via `await _localizer.GetForUserAsync(...)`.

---

## 🌍 Backend Localization (`ILocalizationService`)
- **No Hardcoded User Strings**: Notifications, error messages, reports, and scheduled job texts MUST NOT be hardcoded.
- **Resource Dictionaries**: Stored as embedded resources (`<EmbeddedResource Include="Resources\**\*.json" />`) in `server/src/Application/Resources/{lang}/{category}.json` (`jobs.json`, `notifications.json`, `scheduler.json`, `report.json`, `auth.json`, `errors.json`).
- **Strongly-Typed Keys (`LocalizationKeys`)**: Declare all keys as constants in `Audex.Application.Constants.LocalizationKeys`.
- **Service Methods**:
  - `localizer.Get(key, lang, args)`: Resolves string with format args and English fallback.
  - `await localizer.GetForUserAsync(key, userId, args)`: Uses target user's `UserProfile.LanguageCode`.
  - `await localizer.GetUserLanguageAsync(userId)`: Returns normalized language code (`"en"` or `"ru"`).
- **Scheduled Jobs**: Declare keys via `[ScheduledJob(..., displayNameKey: ..., descriptionKey: ..., categoryKey: ...)]`.
- **CI Gate (`LocalizationIntegrityTests`)**: All keys across EN/RU dictionaries and `LocalizationKeys` are validated automatically; missing keys fail tests.

---

## 🧪 Testing & Commands
- **100% Service Coverage**: Every application service in `Audex.Application` MUST have comprehensive unit tests in `server/tests/Application.Tests` mirroring the `server/src/Application` folder hierarchy.
- **Style**: xUnit, NSubstitute / Moq, AutoFixture with AAA (Arrange-Act-Assert).
- **Mandatory Traits**:
  - `[Trait("Category", "S3")]`: All tests touching `IFileStorageService` / MinIO (`FileStorageServiceTests`, icon uploads/deletions). Use `ServiceProviderFixture`.
  - `[Trait("Category", "Auth")]`: All tests for authentication, JWT/Refresh tokens, login, and password changes (`AuthServiceTests`).
- **Commands** (run from `server/` unless noted):
  - Build: `cd server && dotnet build`
  - Run WebApi: `dotnet run --project server/src/WebApi` (or `dotnet watch --project server/src/WebApi`)
  - Run All Tests: `cd server && dotnet test`
  - Run S3 Tests: `cd server && dotnet test --filter-trait "Category=S3"`
  - Run Auth Tests: `cd server && dotnet test --filter-trait "Category=Auth"`
  - Run via MTP runner: `dotnet run --project tests/Application.Tests -- -trait "Category=Auth"`

