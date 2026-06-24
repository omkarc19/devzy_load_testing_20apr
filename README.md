# Devzy Orders API (TypeScript)

A small order-management micro-service built with **Express + TypeScript**. It
exposes a REST API to create orders, price them, reserve inventory, and move
them through a status lifecycle.

> **Why this repo exists**
> This is one of six language fixtures in the `devzyai-eval` organization used
> to evaluate NeatCode's review quality. The `main` branch is a clean, working
> baseline; evaluation scenarios are introduced later as pull requests.

## Tech stack

| Concern        | Choice                          |
| -------------- | ------------------------------- |
| Runtime        | Node.js >= 20                   |
| Language       | TypeScript (strict)             |
| HTTP framework | Express                         |
| Validation     | Zod                             |
| Logging        | Pino                            |
| Tests          | Vitest                          |

## Project layout

```
src/
├── index.ts                  Process entry point + graceful shutdown
├── app.ts                    Builds the Express app + dependency graph
├── config/env.ts             Env parsing & validation (Zod)
├── models/order.ts           Domain types + status-transition rules
├── repositories/             Data access (in-memory, swappable for a DB)
│   └── orders.repository.ts
├── services/                 Business logic
│   ├── orders.service.ts     Order lifecycle orchestration
│   ├── inventory.service.ts  Stock reservation / release
│   └── pricing.service.ts    Subtotal + discount calculation
├── controllers/              HTTP layer (validation + serialization)
│   └── orders.controller.ts
├── routes/                   Route definitions
│   ├── orders.routes.ts
│   └── health.routes.ts
├── middleware/               Cross-cutting concerns
│   ├── auth.ts               API-key guard for writes
│   ├── error-handler.ts      Central error -> HTTP mapping
│   └── async-handler.ts      Promise-rejection forwarding
└── utils/                    Shared helpers
    ├── money.ts              Integer-minor-unit money type
    ├── errors.ts             Domain error hierarchy
    ├── validation.ts         Zod request schemas
    └── logger.ts             Pino logger factory
tests/                        Vitest unit tests
```

## Getting started

```bash
npm install
cp .env.example .env
npm run dev          # start with hot reload
```

Build and run the compiled output:

```bash
npm run build
npm start
```

Run the test suite and type checks:

```bash
npm test
npm run typecheck
npm run lint
```

## API

Write endpoints require the `x-api-key` header matching `API_KEY`.

| Method | Path                  | Auth | Description                  |
| ------ | --------------------- | ---- | ---------------------------- |
| GET    | `/health`             | —    | Liveness probe               |
| GET    | `/ready`              | —    | Readiness probe              |
| GET    | `/orders`             | —    | List orders (paginated)      |
| GET    | `/orders/:id`         | —    | Fetch a single order         |
| POST   | `/orders`             | key  | Create an order              |
| PATCH  | `/orders/:id/status`  | key  | Transition an order's status |
| POST   | `/orders/:id/cancel`  | key  | Cancel an order              |

### Create an order

```bash
curl -X POST http://localhost:8080/orders \
  -H 'content-type: application/json' \
  -H 'x-api-key: local-dev-key' \
  -d '{
    "customerId": "cust-42",
    "currency": "USD",
    "discountPercent": 10,
    "items": [
      { "sku": "SKU-WIDGET", "name": "Widget", "quantity": 2, "unitPriceMinor": 1299 }
    ]
  }'
```

### Order status lifecycle

```
pending ──▶ confirmed ──▶ shipped ──▶ delivered
   │            │
   └──▶ cancelled ◀──┘
```

Cancelling an order releases its reserved inventory. Terminal states
(`delivered`, `cancelled`) cannot transition further.

## Configuration

All configuration is environment-driven and validated at startup
(see [`.env.example`](.env.example)):

| Variable          | Default       | Description                            |
| ----------------- | ------------- | -------------------------------------- |
| `PORT`            | `8080`        | HTTP listen port                       |
| `LOG_LEVEL`       | `info`        | Pino log level                         |
| `API_KEY`         | —             | Shared secret for write endpoints      |
| `DEFAULT_CURRENCY`| `USD`         | Fallback ISO 4217 currency             |
| `MAX_ORDER_ITEMS` | `50`          | Max line items per order               |

## Docker

```bash
docker compose up --build
```
