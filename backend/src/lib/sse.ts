import type { Response } from "express";

// SSE event writer. All chat endpoints stream text/event-stream with the events:
//   {"type":"token","content":"..."}
//   {"type":"widget","widget":{...}}
//   {"type":"route","route":"booking","reason":"..."}
//   {"type":"agent","agentId":"...","agentName":"..."}  // group waterfall marker
//   {"type":"done"}
//   {"type":"error","message":"..."}

export function startSse(res: Response): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(": stream-open\n\n");
}

export function sendEvent(res: Response, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function endSse(res: Response): void {
  sendEvent(res, { type: "done" });
  res.end();
}

export function errorSse(res: Response, message: string): void {
  sendEvent(res, { type: "error", message });
  res.end();
}
