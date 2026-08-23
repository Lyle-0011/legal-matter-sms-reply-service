import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { ZodError } from "zod";
import { infrai, InfraiError } from "./infrai.js";
import { decideMatterReply, inboundReplySchema } from "./reply_decision.js";

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

async function handleInbound(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    const inbound = inboundReplySchema.parse(await readJson(request));
    const decision = decideMatterReply(inbound);
    const sent = await infrai.sms.send({
      to: inbound.from,
      body: decision.reply,
      idempotency_key: `legal-reply-${inbound.event_id}`,
    });
    json(response, 202, { matter_id: inbound.matter_id, action: decision.action, message_id: sent.message_id });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      json(response, 400, { error: "Invalid inbound reply" });
      return;
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      json(response, status, { error: error.code });
      return;
    }
    console.error(error);
    json(response, 500, { error: "Request could not be processed" });
  }
}

export const server = createServer((request, response) => {
  if (request.method === "POST" && request.url === "/inbound/sms") {
    void handleInbound(request, response);
    return;
  }
  json(response, 404, { error: "Not found" });
});

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, () => console.log(`Matter reply service listening on http://localhost:${port}`));
}
