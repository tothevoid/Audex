# Development Guidelines & Conventions for Audex

This document contains guidelines, coding standards, and architectural patterns for developing features in Audex.

> **Important**: This document (`AGENTS.md`) and `claude.md` must ALWAYS be updated synchronously whenever development rules, guidelines, or patterns are modified.

---

## 🛠️ Server (Backend) Rules & Architecture

### Stack & Solution Structure
- **Framework**: .NET 10 Web API
- **Layering**:
  - `server/src/WebApi`: ASP.NET Core Controllers and DTO models. Controllers must remain thin and delegate logic to application services.
  - `server/src/Application`: Core business logic, services (`Audex.Application.Services`), interfaces (`Audex.Application.Interfaces`), and DTOs (`Audex.Application.DTO`).
  - `server/src/Infrastructure`: EF Core DbContext, entity configurations, and migrations.
  - `server/src/Shared`: Common constants and helper models.
  - `server/tests/Application.Tests`: Unit tests for application services (`Audex.Application.Tests`).
  - `server/tests/Infrastructure.Tests`: Tests for infrastructure components (`Audex.Infrastructure.Tests`).
  - `server/tests/Tests.Shared`: Shared fixtures and test helpers (`Audex.Tests.Shared`).
- **Orphan Directory Prohibition**: Do NOT create or restore legacy directories (`server/BLL`, `server/DAL`, `server/Common`, `server/MoneyManager`, `server/server`, or root layer folders outside `server/src/` and `server/tests/`). Only project folders declared in `Audex.slnx` under `server/src/` and `server/tests/` are valid.

### DTO Naming Conventions
- **PascalCase with `Dto` Suffix**: All Data Transfer Object classes and files MUST use PascalCase with the `Dto` suffix (e.g. `AccountDto.cs`, `SecurityTransactionDto.cs`, `BrokerAccountSummaryDto.cs`, `UserProfileDto.cs`). Do NOT use `*DTO` all-caps suffix.

### Async Method Suffix (`*Async`)
- **Mandatory `Async` Suffix**: ALL asynchronous methods returning `Task` or `Task<T>` across all server layers MUST end with the `Async` suffix:
  - **Infrastructure**: Repositories (`AddAsync`, `GetByIdAsync`, `GetAllAsync`, `GroupAsync`, `GetCountAsync`, `FindAsync`, `DeleteAsync`, `GetMinAsync`, `GetMaxAsync`, `GetSumAsync`, `SaveChangesAsync`), Unit of Work (`CommitAsync`), Notifiers (`SendToAllAsync`).
  - **Application Services**: All service interfaces and implementations (`AddAsync`, `GetByIdAsync`, `GetAllAsync`, `GetPaginationAsync`, `UpdateAsync`, `DeleteAsync`, `GetSummaryAsync`, etc.).
  - **Integrations & Jobs**: External providers (`GetCandlesAsync`, `PullRatesAsync`) and background jobs (`PullQuotationsAsync`, `CleanUpOldNotificationsAsync`).
  - **WebApi Controllers**: Controller action methods must call these `*Async` methods with `await`.

### EF Core & Service Layer Performance Guidelines
- **BaseEntity Inheritance**: ALL database entities in `server/src/Infrastructure/Entities` (including domain entities, join entities, and lookup tables) MUST inherit from `BaseEntity`.
- **Entity Identification**: Every entity uses `Guid Id` inherited from `BaseEntity` as its primary key. Do NOT use composite keys or explicit `builder.HasKey(...)` in entity configurations, as EF Core automatically configures `Id` by convention.
- **Assigning Entity Ids**: When creating entity instances (including join entities) in application services, explicitly assign `Id = Guid.NewGuid()`.
- **Navigation Property Includes (`GetFullHierarchyColumns`)**: In application services, encapsulate Entity Framework `.Include()` / `.ThenInclude()` navigation loadings inside a private helper method `GetFullHierarchyColumns(IQueryable<TEntity> query)` passed as the `include` parameter to `GetAllAsync` and `GetByIdAsync`.
- **Join Entity Synchronization (Differential Sync)**: When updating an entity with join entity collections (e.g. `debt.DebtTags`), do NOT use `.Clear()` and re-add all items. Implement differential synchronization: remove only associations whose target IDs are missing from the request, and add new join entities only for target IDs not already associated. This avoids `DbUpdateConcurrencyException` and unnecessary DB deletes/inserts.
- **Read Query Optimization**: All read-only queries in services MUST use `.AsNoTracking()` to avoid unnecessary change-tracking memory allocations.
- **Batch Async Execution**: Avoid sequential `await` inside `foreach` loops for multi-account computations. Use `Task.WhenAll` or aggregated SQL queries.
- **Direct Bulk Deletes**: Prefer EF Core `ExecuteDeleteAsync()` for primary-key deletions rather than fetching detached entity instances prior to deletion.

### Infrastructure Model Changes & Migrations Workflow
- **Mandatory User Confirmation for Model Changes**: NEVER modify database entities, models, or configurations in `server/src/Infrastructure` (`server/src/Infrastructure/Entities/`, `server/src/Infrastructure/Configurations/`, `ApplicationDbContext.cs`) without first explicitly presenting the proposed schema changes and obtaining confirmation from the user.
- **Uncommitted Migration Re-generation Workflow**:
  - If entity/model changes are approved and made, and the current migration is NOT yet committed to git:
    1. Roll back the database to the previous migration: `dotnet ef database update <PreviousMigrationName> --project src/Infrastructure --startup-project src/WebApi`
    2. Remove the uncommitted migration: `dotnet ef migrations remove --project src/Infrastructure --startup-project src/WebApi`
    3. Apply the approved entity modifications.
    4. Generate a clean new migration: `dotnet ef migrations add <MigrationName> --project src/Infrastructure --startup-project src/WebApi`
    5. Apply the migration: `dotnet ef database update --project src/Infrastructure --startup-project src/WebApi`

### Application Service Testing
- **100% Service Coverage**: Every application service in `Audex.Application` MUST have comprehensive unit test coverage in `Audex.Application.Tests` (`server/tests/Application.Tests`).
- **Directory Hierarchy**: Test file structure under `server/tests/Application.Tests` must mirror `server/src/Application`.
- **Test Style**: xUnit, NSubstitute / Moq, AutoFixture using the AAA (Arrange-Act-Assert) pattern.
- **S3 / File Storage Testing (`[Trait("Category", "S3")]`)**: All test classes or methods interacting with `IFileStorageService` / MinIO (e.g. `FileStorageServiceTests`, icon uploads/deletions in `BankServiceTests`, `SecurityServiceTests`, `TransactionTypeServiceTests`, `CryptocurrencyServiceTests`) MUST be tagged with `[Trait("Category", "S3")]`. Use `ServiceProviderFixture` for isolated container management.
- **Auth Testing (`[Trait("Category", "Auth")]`)**: All test classes or methods testing authentication, JWT/Refresh tokens, login, and password changes (e.g. `AuthServiceTests`) MUST be tagged with `[Trait("Category", "Auth")]`.

### API Controllers & Dual Endpoint Pattern
- **Date Parameters**: Use `DateOnly` (`YYYY-MM-DD`) for API query parameters.
- **Unused Parameters Prohibition**: Controller action method signatures MUST NOT accept parameters that are not passed to underlying services.
- **Dual Endpoints**: When `brokerAccountId` is optional/nullable:
  - Provide `GetAll(...)` for summary/aggregate view across all accounts.
  - Provide `GetByBrokerAccount(..., Guid brokerAccountId)` for a single account view.
- **Error Responses**: Exception handling must return standard RFC 7807 JSON `ProblemDetails` payloads.
- **Operation Result Pattern (`OperationResultDto<T>`)**: For mutating operations where business validation or domain conflicts can occur (e.g. unique constraint checks like ticker uniqueness), application services and controller action methods return `OperationResultDto<T>` (`IsSuccess`, `Data`, `ErrorMessage`) rather than throwing raw unhandled exceptions. Localized error messages must be retrieved using `await _localizer.GetForUserAsync(...)`.

### Backend Localization & i18n Architecture (`ILocalizationService`)
- **Prohibition of Hardcoded Strings**: User-facing texts, notifications, error messages, export reports, and scheduled task names/descriptions MUST NOT be hardcoded in backend code.
- **Resource JSON Dictionaries**: All backend localization strings reside under `server/src/Application/Resources/{lang}/{category}.json` (e.g. `Resources/en/jobs.json`, `Resources/ru/jobs.json`, `notifications.json`, `scheduler.json`, `report.json`, `auth.json`, `errors.json`).
  - Resources are embedded in assembly (`<EmbeddedResource Include="Resources\**\*.json" />`).
- **Strongly-Typed Keys (`LocalizationKeys`)**: All string keys MUST be declared as constants in `Audex.Application.Constants.LocalizationKeys` (e.g. `LocalizationKeys.Jobs.CleanUpExpiredTokens.Name`, `LocalizationKeys.Jobs.Categories.Auth`, `LocalizationKeys.Notifications.SessionCleanUpTitle`).
- **Service Usage (`ILocalizationService`)**:
  - `localizer.Get(key, lang, args)`: Resolves text for specific language code with format arguments and English fallback.
  - `await localizer.GetForUserAsync(key, userId, args)`: Resolves text using target user's configured `UserProfile.LanguageCode`.
  - `await localizer.GetUserLanguageAsync(userId)`: Centralized helper returning normalized user language code (`"en"` or `"ru"`), eliminating manual `IUserProfileService` lookups and fallbacks.
- **Scheduled Jobs Localization (`ScheduledJobAttribute`)**: Background jobs declare localization keys via `displayNameKey`, `descriptionKey`, and `categoryKey` in `[ScheduledJob(..., displayNameKey: ..., descriptionKey: ..., categoryKey: ...)]`. The scheduler service dynamically translates descriptors upon querying.
- **CI Integrity Gate (`LocalizationIntegrityTests`)**: All dictionary keys and `LocalizationKeys` constants are validated in automated tests. Any missing keys between English and Russian dictionaries will fail the test suite.

### Server Commands
- **Build**: `cd server && dotnet build`
- **Run WebApi**: `dotnet run --project server/src/WebApi` (или `dotnet watch --project server/src/WebApi`)
- **Run All Tests**: `cd server && dotnet test`
- **Run S3 Tests**: `cd server && dotnet test --filter "Category=S3"`
- **Run Auth Tests**: `cd server && dotnet test --filter "Category=Auth"`

---

## 🎨 Client (Frontend) Rules & Architecture

### Stack & Structure
- **Framework**: React 19 + TypeScript + Vite (`client/src`).
- **UI & Styling**: Chakra UI v3, `react-icons`.
- **Theme**: Modular Dual Theme System (`client/src/theme/`) supporting **Dark Theme** (`#121212`) and **Solarized Sand Light Theme** (`#fbf8f2` warm paper/sand palette) with semantic tokens (`background_main`, `background_primary`, `background_secondary`, `text_primary`, `text_secondary`, `border_primary`, `action_primary`, `gain`, `loss`, `status_*`). Theme switching is managed via `ColorModeProvider` / `useColorMode()` and persisted in `localStorage`.
- **i18n**: `react-i18next`.
- **Directory Scope**: ALL client source files (components, features, pages, hooks) MUST reside under `client/src/`. Do NOT create feature folders at `client/features`.
- **Structure**:
  - `client/src/theme`: Modular theme system (`colors/`, `recipes/`, `types.ts`, `index.ts`).
  - `client/src/features`: Shared domain feature modules (e.g. Navigation, UserProfileSettingsModal).
  - `client/src/models/<domain>`: Domain interfaces, requests (`*EntityRequest`), responses (`*EntityResponse`).
  - `client/src/api/<domain>`: API client functions and response/request mappers.
  - `client/src/pages`: Feature pages (`BrokerAccount`, `BrokerAccounts`, `SecurityPage`, `Transactions`, etc.).
  - `client/src/shared`: Reusable components (`MoneyCard`, `DateSelect`), hooks (`shared/hooks/`), utilities.
  - `client/src/locales`: Localization files (`en.json`, `ru.json`).

### File Placement & Naming Rules (Models, APIs & Mappers)
1. **Entities & DTO Models**:
   - **Path**: `client/src/models/<domain>/` (e.g. `brokers/`, `accounts/`, `securities/`, `transactions/`, `deposits/`, `debts/`, `crypto/`).
   - **Naming**: `<EntityName>.ts` or `<EntityName>Entity.ts` (e.g. `BrokerAccountPortfolioHistoryEntity.ts`, `BrokerAccountEntity.ts`).
   - Include domain entities, request payloads (`*EntityRequest`), and raw API responses (`*EntityResponse`).

2. **API Clients**:
   - **Path**: `client/src/api/<domain>/` (e.g. `api/brokers/`, `api/accounts/`, `api/dashboard/`).
   - **Naming**: `<camelCaseEntity>Api.ts` (e.g. `brokerAccountPortfolioHistoryApi.ts`, `brokerAccountSummaryApi.ts`, `brokerAccountFundsTransferApi.ts`, `dashboardApi.ts`).
   - Use standard HTTP wrappers from `client/src/api/basicApi.ts` (`getEntity`, `getAllEntities`, `postEntity`, etc.).

3. **Mappers (API Mapping)**:
   - **Path**: `client/src/api/<domain>/` (placed next to the corresponding API file).
   - **Naming**: `<camelCaseEntity>ApiMapping.ts` or `<camelCaseEntity>Mapping.ts` (e.g. `brokerAccountApiMapping.ts`, `brokerAccountFundsTransferMapping.ts`).
   - **Functions**: Use shared helpers (`parseEntityDates`, `formatRequestDates`) to avoid duplicated mapping boilerplate.

4. **Hooks**:
   - **Path**: `client/src/shared/hooks/` or domain-specific hooks.
   - **Naming**: `use<PascalCaseName>.ts` (e.g. `useSignalR.ts`, `useEntityData.ts`).

### Localization Rules (i18n)
- **Modular Directory Structure**: Locales are organized semantically into domain folders under `client/src/locales/en/` and `client/src/locales/ru/`, aggregated via `index.ts`:
  - `common/`: `general.json` (headers, dashboard, settings), `modals.json` (action buttons, confirm dialogs).
  - `accounts/`: `accounts.json` (balances, accounts page, transfer modal).
  - `broker/`: `broker.json` (broker accounts, cards, stats), `transfers.json` (fund transfers), `taxes.json` (tax deductions).
  - `securities/`: `securities.json` (securities, transactions, quotes), `dividends.json` (dividends, payments).
  - `debts/`: `debts.json` (debtors, payments), `tags.json` (tags system, tag statistics).
  - `deposits/`: `deposits.json` (deposits, earnings charts).
  - `crypto/`: `crypto.json` (cryptocurrencies, providers, crypto accounts).
  - `transactions/`: `transactions.json` (transactions, stats), `currency.json` (currency transactions).
  - `data/`: `data.json` (reference tables: banks, brokers, currencies, types).
  - `validation/`: `validation.json` (all `validation_*` error messages).
  - `auth/`: `auth.json` (login, change password).
- **Dual Translations Mandatory**: Every user-facing string MUST be added to **both** the corresponding English (`client/src/locales/en/<domain>/<file>.json`) and Russian (`client/src/locales/ru/<domain>/<file>.json`) files.
- **Key Format**: Use `snake_case` keys categorized by domain/feature (e.g. `broker_account_page_*`, `entity_*`, `validation_*`).
- **Hook**: Access strings via `const { t } = useTranslation()`.
- **Preserve Blank Lines**: Keep blank lines in JSON files between logical key blocks for semantic grouping. Do NOT delete or format away empty lines.

### Zod Validation Schemas & Localization
- **Factory Function Pattern**: ALL Zod validation schemas MUST be defined as factory functions accepting `t: TFunction` from `i18next` and returning `z.ZodObject`:
  ```ts
  import { z } from 'zod';
  import { TFunction } from 'i18next';

  export const getDebtValidationSchema = (t: TFunction) => z.object({
      id: z.string().optional(),
      name: z.string().min(1, t("validation_field_required")),
      amount: z.number().gt(0, t("validation_positive_number")),
      account: z.object({
          id: z.string().min(1, t("validation_account_required")),
          name: z.string()
      }, { message: t("validation_account_required") })
  });

  export type DebtFormInput = z.infer<ReturnType<typeof getDebtValidationSchema>>;
  ```
- **Validation Key Prefix**: All validation error message keys in `ru.json` and `en.json` MUST use the `validation_*` prefix (e.g. `validation_field_required`, `validation_positive_number`, `validation_date_required`, `validation_<entity>_required`).
- **Form Component Integration**: In modals/forms, instantiate the schema with `useMemo(() => get*ValidationSchema(t), [t])` so validation errors dynamically update on language switches:
  ```tsx
  const { t } = useTranslation();
  const validationSchema = useMemo(() => getDebtValidationSchema(t), [t]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<DebtFormInput>({
      resolver: zodResolver(validationSchema),
      mode: "onBlur",
      defaultValues: getDefaultFormState()
  });
  ```

### UI/UX & Component Guidelines
- **Money & Numeric Inputs (`MoneyInput`)**: ALL monetary amounts, currency rates, prices, percentages, and quantities in forms and modals MUST use the shared `<MoneyInput />` component (`client/src/shared/components/MoneyInput/MoneyInput.tsx`). Do NOT use native `<Input type="number">` or `{ valueAsNumber: true }`.
  - **Required `currency` Prop**: Always pass `currency: string` (e.g. `currency="RUB"`, `currency={selectedCurrency?.name ?? ''}`, `currency="%"`, or `currency="шт."`).
  - **Precision (`decimalScale`)**: Defaults to `2` (monetary amounts). Use `decimalScale={4}` for currency exchange rates / crypto prices, `decimalScale={8}` for crypto quantities, and `decimalScale={0}` for integer units/shares.
  - **Words Helper (`showWordsHelper`)**: Automatically shows a human-readable words preview for amounts $\ge 1\,000$ (e.g. `💡 10 млн ₽` / `💡 10M USD`). Set `showWordsHelper={false}` for percentages and non-monetary quantities.
  - **Usage Example**:
    ```tsx
    <Field.Root invalid={!!errors.amount}>
        <Field.Label>{t("entity_transaction_money_quantity")}</Field.Label>
        <MoneyInput name="amount" control={control} currency={currentCurrency} placeholder="500" />
        <Field.ErrorText>{errors.amount?.message}</Field.ErrorText>
    </Field.Root>
    ```
- **Loading & Empty States**: Pages MUST use Skeleton loaders (`CardSkeleton`, `TableSkeleton`) during data fetches and `<EmptyStatePlaceholder>` when entity collections are empty.
- **Date Picker**: Use `react-datepicker` (`DatePicker`) with Chakra UI `<Input width="200px" color="text_primary" backgroundColor="background_primary" borderColor="border_primary" />`.
- **Default Date**: Default to today (`new Date()`). Display as `dd.MM.yyyy` to the user, and format as ISO date `YYYY-MM-DD` for API queries.
- **Themes & Scrollbars**: The application supports Dark Theme and Solarized Sand Light Theme via Chakra UI v3 semantic tokens. Root elements (`html`, `body` in `index.css`) support `[data-theme="dark"]` and `[data-theme="light"]`, matching scrollbars and WebKit autofill styles. Always preserve `scrollbar-gutter: stable` on `html` to prevent layout jumping/shifting between scrollable and non-scrollable pages.
- **Layout & Styling**: Use Chakra UI v3 theme tokens (`background_main`, `background_primary`, `background_secondary`, `text_primary`, `text_secondary`, `border_primary`, `action_primary`) and `<SimpleGrid columns={2} gap={4}>` with `<MoneyCard>` for metric grids. Do NOT use hardcoded hex/rgb/rgba colors in components.

### API Client Functions
- **Dual Endpoint Handling**: API functions accept `brokerAccountId: Nullable<string>` and switch URLs conditionally:
  ```ts
  const url = brokerAccountId
      ? `${basicUrl}/GetByBrokerAccount?date=${date}&brokerAccountId=${brokerAccountId}`
      : `${basicUrl}/GetAll?date=${date}`;
  ```
- **Operation Result API Functions**: For mutating endpoints returning `OperationResultDto<T>`, use universal wrappers in `client/src/api/basicApi.ts` (`createEntityWithIconResult`, `updateEntityWithIconResult`, `createEntityResult`, `updateEntityResult`, `deleteEntityResult`) with optional response mapping callbacks (`mapResponse`). Keep low-level multipart form construction (`generateForm`) encapsulated inside `basicApi.ts`.

### Client Commands
- **Build**: `cd client && npm run build`
- **Dev Server**: `cd client && npm run dev`

---

## 🔄 Verification Commands & Workflow
- **Mandatory Pre-Verification Build Check**: BEFORE reporting completion and before asking the user about test execution or adjustments, ALWAYS verify that the modified components compile and build without errors:
  - **Server Changes (`server/`)**: Automatically run `dotnet build` in `server/` to ensure zero compilation errors.
  - **Client Changes (`client/`)**: Automatically run `npm run build` in `client/` to ensure zero TypeScript and bundling errors.
  - **Both / Full-Stack Changes**: Automatically run both `dotnet build` in `server/` and `npm run build` in `client/`.
  If the build fails, fix all compilation/build errors before reporting to the user.
- **Confirmation Before Long Test Suites**: Once the build succeeds, prompt the user before running long unit/integration test suites: ask whether any adjustments/corrections are needed or if we should proceed to running the test suites (`dotnet test`).
- **Selective Test Execution**: Once confirmed by the user, execute tests selectively based on the scope of changes made during the task:
  - **Server / Application Changes**: Run `dotnet test` in `server/`.
  - **S3 / File Storage Changes**: Run `dotnet test --filter "Category=S3"` (or full `dotnet test`) in `server/`.
  - **Auth Changes**: Run `dotnet test --filter "Category=Auth"` (or full `dotnet test`) in `server/`.
  - **Full-Stack Changes**: Run `dotnet test` in `server/`.

Do NOT run verification commands for a component (client or server) if no changes were made to that component.
