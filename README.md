# Audex

**Self-hosted wealth & asset management platform.**

[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

[Key Features](#key-features) • [Tech Stack](#tech-stack) • [Self-Hosting](#self-hosting) • [Development](#development)

---

## Overview

Audex is a self-hosted web application for tracking personal finances, investments, and assets across bank accounts, broker portfolios, crypto, deposits, and debts.

---

## Key Features

### Assets & Accounts
- **Broker Accounts**: Securities, historical quotes/candles, dividends, and PnL tracking.
- **Crypto**: Crypto accounts, coin tracking.
- **Bank Accounts**: Multi-currency accounts and transactions.
- **Deposits**: Terms, interest rates, maturity dates, and earnings charts.
- **Debts**: Debtor management, partial repayments, and tag statistics.

### Automation & Reports
- **Scheduler**: Background jobs with cron schedules, execution logs, and history journal.
- **Quotes Sync**: Periodic background fetching of exchange rates and security quotes.
- **Reports**: Export `.xlsx` spreadsheets with current balances and asset structures.

### Backups & Security
- **Database Backups**: Plain Gzip SQL dumps or encrypted files using Argon2id and AES-256-GCM.
- **Restore**: Database restore directly from the web interface.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Chakra UI v3, Recharts, React Hook Form, Zod, i18next (EN / RU) |
| **Backend** | .NET 10 Web API, Entity Framework Core, SignalR, TickerQ Scheduler |
| **Databases** | PostgreSQL 17.4, MinIO (S3-compatible object storage for icons & backup artifacts) |
| **Deploy** | Docker, Docker Compose |

---

## Self-Hosting

Deploy the full Audex stack on your server in minutes:

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose

### Deployment Steps

1. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Configure your secrets, ports, and credentials in .env
   ```

2. **Launch All Services**:
   ```bash
   docker compose -p audex up --build -d
   ```

3. **Apply Database Migrations (Optional)**:
   ```bash
   cd server
   dotnet ef database update --project Infrastructure --startup-project WebApi
   ```

---

## Development

Run the full local development environment with hot reloading:

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/)

### Local Setup Steps

1. **Start Infrastructure Services (Database & Storage)**:
   ```bash
   docker compose -p audex_dev --env-file .env.dev up -d database files-database infrastructure_manager
   ```

2. **Run Backend API**:
   ```bash
   dotnet run --project server/src/WebApi
   ```

3. **Run Frontend Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. Open [http://localhost:9500](http://localhost:9500) in your browser.