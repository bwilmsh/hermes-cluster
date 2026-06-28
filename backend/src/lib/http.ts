import { request, Agent } from "undici";

const dispatcher = new Agent({ keepAliveTimeout: 30_000 });

// Thin fetch wrapper around undici for proxying to the Python agent service.
export async function postJsonSse(
  url: string,
  body: unknown,
  onChunk: (chunk: Buffer) => void,
  signal?: AbortSignal
): Promise<number> {
  const res = await request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
    dispatcher,
    signal,
  });
  if (res.statusCode !== 200) {
    throw new Error(`Upstream ${url} returned ${res.statusCode}`);
  }
  for await (const chunk of res.body as any) {
    onChunk(Buffer.from(chunk));
  }
  return res.statusCode;
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    dispatcher,
  });
  const text = await (res.body as any).text();
  return JSON.parse(text) as T;
}
