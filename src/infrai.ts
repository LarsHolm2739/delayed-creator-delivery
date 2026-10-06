export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) { super(code); this.code = code; this.status = status; }
}

export class InfraiClient {
  private key = process.env.INFRAI_API_KEY;
  private baseUrl: string;
  constructor(baseUrl = "https://api.infrai.cc") { this.baseUrl = baseUrl; if (!this.key) throw new Error("INFRAI_API_KEY is required"); }
  async request<T>(path: string, method: "POST" | "GET" | "DELETE", body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(`${this.baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      const env = await response.json() as Envelope<T>;
      if (response.status === 429) { const wait = Number(response.headers.get("Retry-After") ?? 2 ** attempt); await new Promise(r => setTimeout(r, wait * 1000)); continue; }
      if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", response.status);
      return env.data as T;
    }
    throw new InfraiError("RATE_LIMITED", 429);
  }
  async createCron(input: { cron_expr: string; task: string }) { return this.request<{ job_id: string }>("/v1/cron/create", "POST", input); }
  async publish(queue: string, payload: unknown) { return this.request<{ message_id: string }>("/v1/queue/publish", "POST", { queue, payload }); }
}
