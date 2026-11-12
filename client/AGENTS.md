# Client (Frontend) Development Guidelines for Audex

These guidelines apply to all frontend code under `client/` and extend the root [AGENTS.md](../AGENTS.md).

---

## 🎨 Stack & Structure
- **Framework**: React 19 + TypeScript + Vite (`client/src`).
- **UI & Styling**: Chakra UI v3, `react-icons`.
- **Theme**: Modular Dual Theme System (`client/src/theme/`) supporting **Dark Theme** (`#121212`) and **Solarized Sand Light Theme** (`#fbf8f2`) via semantic tokens (`background_main`, `background_primary`, `background_secondary`, `text_primary`, `text_secondary`, `border_primary`, `action_primary`, `gain`, `loss`, `status_*`). Managed via `ColorModeProvider` / `useColorMode()` in `localStorage`. Never use hardcoded hex/rgb/rgba colors in components.
- **i18n**: `react-i18next`.
- **Directory Scope**: ALL client source files MUST reside under `client/src/` (never create `client/features`):
  - `client/src/theme`: `colors/`, `recipes/`, `types.ts`, `index.ts`.
  - `client/src/features`: Shared domain feature modules (Navigation, UserProfileSettingsModal).
  - `client/src/models/<domain>`: Domain interfaces, `*EntityRequest`, `*EntityResponse`.
  - `client/src/api/<domain>`: API clients (`<camelCaseEntity>Api.ts`) and mappers (`<camelCaseEntity>ApiMapping.ts` or `*Mapping.ts`).
  - `client/src/pages`: Feature pages (`BrokerAccount`, `BrokerAccounts`, `SecurityPage`, `Transactions`, etc.).
  - `client/src/shared`: Reusable components (`MoneyCard`, `DateSelect`), hooks (`shared/hooks/use<PascalCaseName>.ts`), utilities.
  - `client/src/locales`: Modular localization files (`en/`, `ru/`).

---

## 📁 File Placement & Mappers
- **Models**: `client/src/models/<domain>/<EntityName>.ts` (or `*Entity.ts`).
- **API Clients**: `client/src/api/<domain>/<camelCaseEntity>Api.ts`.
- **Mappers**: Placed next to the API file. Use shared helpers (`parseEntityDates`, `formatRequestDates`) instead of duplicating date mapping boilerplate.
- **Hooks**: `client/src/shared/hooks/use<PascalCaseName>.ts` or domain-specific hooks.

---

## 🌍 Localization Rules (i18n)
- **Modular Structure**: `client/src/locales/en/` & `ru/` aggregated via `index.ts`:
  - `common/` (`general.json`, `modals.json`), `components/` (`datePicker.json`), `accounts/`, `broker/` (`broker.json`, `transfers.json`, `taxes.json`), `securities/` (`securities.json`, `dividends.json`), `debts/` (`debts.json`, `tags.json`), `deposits/`, `crypto/`, `transactions/` (`transactions.json`, `currency.json`), `data/`, `validation/` (`validation.json`), `auth/`.
- **Dual Translations Mandatory**: Every user-facing string MUST be added to **both** EN and RU dictionaries.
- **Key Format**: `snake_case` categorized by domain (`broker_account_page_*`, `entity_*`, `validation_*`).
- **No Inline Fallbacks**: NEVER pass fallback strings as the second argument to `t(...)` (e.g. `t("key", "Текст")`). Always call `t("key")` cleanly.
- **Preserve Blank Lines**: Keep blank lines in JSON files between logical key blocks; do NOT format them away.

---

## ✅ Zod Validation & Forms
- **Factory Function Pattern**: ALL Zod schemas MUST be factories accepting `t: TFunction` and returning `z.ZodObject`:
  ```ts
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
- **Prefix**: Validation keys MUST use `validation_*` (e.g. `validation_field_required`, `validation_positive_number`, `validation_<entity>_required`).
- **Form Integration**: Instantiate via `useMemo(() => get*ValidationSchema(t), [t])` so errors update dynamically on language switches.

---

## ⚛️ React Hooks & Infinite Loop Prevention
- **No Hook Crutches**: NEVER suppress re-render/request loops in custom hooks by copying params/callbacks/filters into `useRef`, emptying `useCallback`/`useMemo` dependency arrays (`[]`) with ref reads, or serializing objects (`JSON.stringify(filters)`) in `useEffect` dependency arrays.
- **Fix at the Source (Caller Level)**:
  - Eliminate unstable references in consuming components/pages.
  - **No Inline Lambdas as Hook Props**: Do NOT pass inline arrow functions (e.g. `keySelector: (item) => item.id`) as hook options; rely on built-in defaults (e.g. in `usePagedQuery`) or stabilize with `useCallback` / module-level constants.
  - **Stable Filter Objects**: Stabilize filter/option objects via `useMemo` or primitives.
  - **Honest Dependencies**: Always declare complete dependency arrays (`react-hooks/exhaustive-deps`).

---

## 🧩 UI/UX & Real-Time Components
- **Money & Numeric Inputs (`MoneyInput`)**: ALL monetary amounts, rates, prices, percentages, and quantities MUST use `<MoneyInput />` (`client/src/shared/components/MoneyInput/MoneyInput.tsx`). Do NOT use `<Input type="number">` or `{ valueAsNumber: true }`.
  - Pass required `currency` prop (e.g. `"RUB"`, `selectedCurrency?.name ?? ''`, `"%"`, `"шт."`).
  - `decimalScale`: `2` (default money), `4` (rates/crypto prices), `8` (crypto quantities), `0` (integer units/shares).
  - `showWordsHelper`: Defaults on for amounts $\ge 1\,000$; set `showWordsHelper={false}` for percentages and non-monetary quantities.
- **Date Picker & DateSelect**: Use `<DatePicker />` or `<DateSelect />` (`client/src/shared/components/DatePicker/` & `DateSelect/`). Renders in `<Portal>`, uses semantic theme tokens, infers localized formats (`dd.MM.yyyy` RU, `yyyy-MM-dd` EN). Do NOT use legacy `react-datepicker` or hardcoded format strings.
- **Toasts (`Toaster` & `notify`)**: Mounted in `App.tsx` (`bottom-end`). Trigger via `notify` (`success`, `error`, `warning`, `info`, `loading`, `promise`, `dismiss`). API errors (network, 400, 500) auto-toast via `httpClient` interceptor with deduplication (`network_error_toast`, `api_error_${message}`); pass `{ skipErrorToast: true }` in Axios config to handle manually. SignalR real-time alerts (`ServerNotificationEvents.ToastReceived`) trigger via `useServerToasts()`.
- **SignalR Real-Time Architecture**:
  - **Single Shared Connection**: NEVER instantiate `HubConnectionBuilder` inside hooks. All SignalR communication goes through singleton `signalRService` (`client/src/shared/services/signalRService.ts`), lifecycle-managed exclusively in `PageWrapper` (`App.tsx`).
  - **Listener Hook (`useSignalR`)**: Components use `useSignalR<TPayload>(eventName, handler)` strictly for listener registration/deregistration (never `startAsync`).
  - **No Raw JSON Dumping**: Use strongly-typed named events from `ServerNotificationEvents` (no generic `ReceiveServerMessage` JSON strings).
- **Scrollbars**: Always preserve `scrollbar-gutter: stable` on `html` (`index.css`) to prevent layout shifts across Dark and Solarized Sand Light themes.

---

## 📱 Responsive Design & Mobile / Tablet (iPad)
- **First-Class Mobile & Tablet Support**: ALL pages, modals, tables, nav bars, and metric cards MUST support mobile (`base`/`sm` < 768px), tablet portrait (`md` 768–991px), tablet landscape (`lg` 992–1279px), and desktop (`xl`+ $\ge$ 1280px).
- **Navigation**: Desktop ($\ge$ lg) uses `HeaderDesktopNav`; mobile/tablet (< lg) uses `HeaderMobileNav` (`Drawer.Trigger asChild`), driven by `navigationConfig.ts`.
- **Tabs (`ResponsiveTabsList`)**: NEVER use horizontal scrolling with hidden scrollbars. Use `ResponsiveTabsList` (`<NativeSelect>` on < breakpoint, `<Tabs.List>` on $\ge$ breakpoint).
- **Metrics & Cards**:
  - Header metrics: `layout={{ base: "grid", lg: "flex" }}`, `columns={{ base: 2, sm: 2, md: 4 }}`, `gap={{ base: 3, md: 4, lg: 6 }}`.
  - List pages: Use `CardsGrid` (`templateColumns="repeat(auto-fill, minmax(320px, 1fr))"`, `gap={4}`).
- **Modals (`BaseModal`)**: All modals inherit responsive sizing from `BaseModal` (`maxH="calc(100dvh - 24px)"`, `p={{ base: "12px", sm: "16px", md: "24px" }}`) with internal scroll.
- **Zero Horizontal Overflow & Touch Targets**: NEVER use fixed pixel widths on containers (`w="1200px"`, `minW="900px"`); use `w="100%"`, `maxW="1560px"`, `minW=0`. Maintain minimum 36px–44px touch targets.

---

## 🌐 API Client (`basicApi`) & Error Handling
- **Mandatory `basicApi` Wrappers**: Direct `httpClient` or `axios` calls in `client/src/api/<domain>/` are prohibited. Use `client/src/api/basicApi.ts`:
  - **Queries**: `getAllEntities`, `getAllEntitiesByConfig`, `getPagedEntities`, `getEntity`, `getEntityByConfig`, `getEntityById`.
  - **Mutations (`OperationResult<T>`)**: `createEntityResult`, `createEntityWithIconResult`, `updateEntityResult`, `updateEntityWithIconResult`, `postEntityResult`, `deleteEntityResult`.
  - **Downloads**: `downloadFileByUrl`, `downloadFileByConfig` (`Nullable<FileDownloadResult>`).
  - **Simple Actions**: `getAction`, `postAction`, `putAction`, `deleteAction`.
- **FormData Multipart**: NEVER manually set `headers: { "Content-Type": "multipart/form-data" }` when passing `FormData`; Axios sets the boundary automatically.
- **Dual Endpoints**: Accept `brokerAccountId: Nullable<string>` and switch between `${basicUrl}/GetByBrokerAccount?...` and `${basicUrl}/GetAll?...`.
- **Error Parsing**: Never swallow errors silently; use `parseErrorMessage(err, t("error_data_load"))` and `parseErrorCode(err)` from `shared/utilities/webApiUtilities.ts`.

---

## 🧰 Shared Utilities Catalog (`client/src/shared/utilities/`)
Always use these centralized utilities instead of reimplementing inline logic:
1. **Collections (`arrayUtilities.ts`)**: `findEntityById`, `resolveDefaultEntityId`, `groupByKey`, `sumEntities`, `insertByPredicate`, `reorderByPredicate`.
2. **Dates (`dateUtils.ts`)**: `convertToDateOnly` (always use for outgoing `DateOnly` payloads; NEVER `.toISOString().slice(0, 10)`), `parseIsoDateOnly`, `getDateParts`, `getMonthByIndex`, `getMonthsNames`, `formatTimestampForReport`, `formatTimestampForBackup`.
3. **Formatters (`formatters/`)**:
   - `dateFormatter.ts`: `formatDate`, `formatDateTime`, `formatShortDateTime`, `formatMonth`, `formatShortMonth`, `formatMonthYear`, `formatMonthYearByDate`, `formatChartAxisDate`, `formatChartTooltipDate`.
   - `moneyFormatter.ts` & `numberWordsFormatter.ts`: `formatMoneyByCurrencyCulture`, `formatAdaptiveNumber`, `formatNumberToWords`.
   - Domain formatters: `accountTypeFormatter.ts`, `securityTypeFormatter.ts`, `fileFormatter.ts`.
4. **Currencies (`currencyUtils.tsx`)**: `getCurrencySymbol`, `getCurrencyColor`, `getCurrencyIcon`.
5. **IDs (`idUtilities.ts`)**: `generateGuid()` (always use for draft/join entity UUIDs; never raw `crypto.randomUUID()`).
6. **Errors (`webApiUtilities.ts`)**: `parseErrorMessage(error: unknown, defaultMessage?)`, `parseErrorCode(error: unknown)`, `ApiException`.
7. **Financial Diffs (`numericDiffsUtilities.ts`)**: `calculateDiff`, `getDiffColor`.
8. **Device Detection (`deviceUtilities.ts`)**: `parseDeviceAndBrowser`.
9. **Colors (`colorUtilities.ts`)**: `parseHexToRgb`, `rgbToHsl`, `hslToRgb`, `getAccessibleColor`.
10. **Modals (`modalUtilities.ts`)**: `BaseModalRef` (`{ openModal: () => void; closeModal: () => void }`).
11. **Editable Grid (`shared/hooks/useEditableGrid.ts`)**: `useEditableGrid<TEntity>`.

---

## 💻 Client Commands
- **Build**: `cd client && npm run build`
- **Dev Server**: `cd client && npm run dev`

