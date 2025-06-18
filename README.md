# MoMo Data Analysis

[![Neon DB](https://img.shields.io/badge/Neon%20DB-Ready-brightgreen)](https://neon.tech)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)](https://vercel.com)
[![Hono](https://img.shields.io/badge/Hono-Framework-blue)](https://hono.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)](https://postgresql.org)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-orange)](https://orm.drizzle.team)

A fullstack application to process SMS data from MTN MoMo service, clean and categorize the data, store it in a relational database, and build a frontend interface to analyze and visualize the data.

## Demo

Check out our demo video:
[Watch Demo](https://vimeo.com/1093790762/7e9f7abe64?share=copy)

## Features

- Parse XML SMS data from mobile money transactions
- Categorize transactions (deposits, withdrawals, payments, etc.)
- Store data in Neon PostgreSQL database using Drizzle ORM
- Track contacts and transaction history
- Analyze spending patterns and transaction history

## Getting Started

### Prerequisites

- Node.js >= 18.x
- PostgreSQL database (Neon DB)

### Environment Variables

Before running the application, set up the following environment variable:

```
DATABASE_URL=postgresql://mom-data-analytics_owner:npg_pGc52kmuoFSg@ep-autumn-haze-a8vt2om2-pooler.eastus2.azure.neon.tech/mom-data-analytics?sslmode=require
```

### Installation

1. Clone the repository
2. Install dependencies:
```
npm install
```
3. Start the development server:
```
npm run dev
```

4. Start your frontend:
   ```
   go in index.html and go live
   ```

   
## Available Scripts

- `npm run dev`: Start the development server with hot-reloading
- `npm run build`: Build the project for production
- `npm run start`: Start the production server
- `npm run process-sms`: Process SMS data from XML format
- `npm run import-sms`: Import processed MoMo transactions to the database
- `npm run db:generate`: Generate database migrations using Drizzle
- `npm run db:push`: Push schema changes to the database
- `npm run test-connection`: Test the database connection
- `npm run deploy`: Deploy the application to Vercel

## Project Structure

```
MoMo-Data-Analysis/
├── src/                    # Source code
│   ├── app/                # Application core
│   ├── controller/         # API controllers
│   ├── db/                 # Database models and connections
│   ├── middleware/         # API middleware
│   ├── routes/             # API routes
│   ├── scripts/            # Utility scripts for data processing
│   │   ├── apply-migrations.ts       # Apply database migrations
│   │   ├── import-momo-transactions.ts # Import transactions to database
│   │   ├── importXmlData.ts          # Import XML data
│   │   ├── process-and-import-sms.ts # Process and import SMS data
│   │   ├── seed-momo-categories.ts   # Seed transaction categories
│   │   └── testConnection.ts         # Test database connection
│   ├── utils/              # Utility functions
│   └── index.ts            # Application entry point
├── frontend/               # Frontend code
├── types/                  # TypeScript type definitions
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── drizzle.config.ts       # Drizzle ORM configuration
```

## Team Members

- Deng Mayen Deng Akol
- Mukunzi Ndahiro James
- Higiro Loic
- Oyinwenebi Fiderikumo
