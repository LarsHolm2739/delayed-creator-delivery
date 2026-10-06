import assert from "node:assert/strict";
import { planDelivery } from "./delayed-delivery.js";
const now = new Date("2026-01-02T10:15:00Z");
const plan = planDelivery({ creatorId: "c", subscriberId: "s", assetId: "a", deliverAfterHours: 4 }, "https://example.test/deliver", now);
assert.equal(plan.cron_expr, "15 14 2 1 *");
assert.deepEqual(plan.payload, { creatorId: "c", subscriberId: "s", assetId: "a" });
console.log("delivery decision test passed");
