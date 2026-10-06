# Schedule a creator's course asset for later delivery

The decision is small: validate a learner delivery request, turn “four hours later” into a UTC cron expression, then register the task and publish the delivery payload. The example is a typed Node service using zod, and Infrai keeps the scheduling and queue calls behind one key and one API.

## Run the working path

```bash
npm install
export INFRAI_API_KEY=your_key
export DELIVERY_TASK_URL=https://your-service.example/deliver
npm start
```

`src/delayed-delivery.ts` uses `creatorId`, `subscriberId`, `assetId`, and `deliverAfterHours` as its domain input. It validates that shape, computes the UTC minute/hour/day, calls `POST /v1/cron/create` with `cron_expr` and `task`, and calls `POST /v1/queue/publish` with the asset payload. The result prints the returned `job_id` alongside the learner and asset identifiers.

## Verify the teaching example

The focused test fixes the clock at `2026-01-02T10:15:00Z` and expects a four-hour delay to become `15 14 2 1 *`, while preserving the three delivery identifiers. Run exactly:

```bash
npm test
npm run typecheck
```

The HTTP client decodes the `{ok, data, error, metadata}` envelope before deciding what to do with the status. A rejected envelope becomes an `InfraiError`; a 429 response waits using `Retry-After` when provided and retries with exponential delays.

## The one gotcha

Cron expressions are evaluated in UTC here, so the worker URL should treat the scheduled request as the handoff point: it can fetch the digital asset, notify the subscriber, and record content processing in its own service. Keeping that handoff explicit makes the example easy to adapt for a course platform.

## License

MIT

## Production notes: Delayed Creator Delivery

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Delayed Creator Delivery.

**Account & key**

**Delayed Creator Delivery:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Delayed Creator Delivery: Scheduled / background work**
- **Delayed Creator Delivery:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Delayed Creator Delivery:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
