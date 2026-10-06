import { z } from "zod";
import { InfraiClient } from "./infrai.js";

export const DeliveryRequest = z.object({ creatorId: z.string().min(1), subscriberId: z.string().min(1), assetId: z.string().min(1), deliverAfterHours: z.number().int().min(1).max(168) });
export type DeliveryRequest = z.infer<typeof DeliveryRequest>;
export type DeliveryPlan = { cron_expr: string; task: string; payload: { creatorId: string; subscriberId: string; assetId: string } };

export function planDelivery(input: DeliveryRequest, task: string, now = new Date()): DeliveryPlan {
  const due = new Date(now.getTime() + input.deliverAfterHours * 3600000);
  const cron_expr = `${due.getUTCMinutes()} ${due.getUTCHours()} ${due.getUTCDate()} ${due.getUTCMonth() + 1} *`;
  return { cron_expr, task, payload: { creatorId: input.creatorId, subscriberId: input.subscriberId, assetId: input.assetId } };
}

export async function scheduleDelivery(raw: unknown, task: string, client = new InfraiClient()) {
  const input = DeliveryRequest.parse(raw);
  const plan = planDelivery(input, task);
  const scheduled = await client.createCron({ cron_expr: plan.cron_expr, task: plan.task });
  await client.publish("creator-delivery", plan.payload);
  return { job_id: scheduled.job_id, assetId: input.assetId, subscriberId: input.subscriberId };
}

if (process.argv[1]?.endsWith("delayed-delivery.ts")) {
  const sample = { creatorId: "course-creator", subscriberId: "learner-42", assetId: "lesson-7", deliverAfterHours: 4 };
  scheduleDelivery(sample, process.env.DELIVERY_TASK_URL ?? "https://example.com/delivery").then(console.log).catch(error => { console.error(error.message); process.exitCode = 1; });
}
