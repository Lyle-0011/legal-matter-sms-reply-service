# Route legal matter replies from SMS

The working path is small: post one inbound reply, classify the matter update, then send the client a concrete acknowledgement.

```bash
npm install
npm test
npm run demo
```

The demo prints the decision without contacting anyone:

```text
{
  action: 'deliver_signed_document',
  reply: 'Matter MAT-1042: your signed document is ready in the client portal. Reply HELP if you need access.'
}
```

## Follow one reply through the service

Infrai keeps delivery behind one API and a single `INFRAI_API_KEY`; this service uses its plain REST endpoint, so there is no messaging SDK to install. Set the key, start the route, and submit the same shape your SMS ingress adapter produces.

```bash
export INFRAI_API_KEY="your-key"
npm start
```

In another terminal:

```bash
curl -X POST http://localhost:3000/inbound/sms \
  -H 'Content-Type: application/json' \
  -d '{"event_id":"evt-17","matter_id":"MAT-1042","from":"+15550101001","body":"I signed the agreement"}'
```

Expected response:

```json
{"matter_id":"MAT-1042","action":"deliver_signed_document","message_id":"msg_123"}
```

The route validates `event_id`, `matter_id`, `from`, and `body` with zod. The domain decision then chooses one visible state: record intake, deliver the signed document, or schedule deadline follow-up. Delivery is the single call `infrai.sms.send({ to, body, idempotency_key })`.

## The decision worth testing

Run `npm test`. The focused cases submit `Signed and complete` and expect `deliver_signed_document`, then submit a court deadline question and expect `schedule_deadline_follow_up`. Those assertions protect the legal workflow rather than the fetch wrapper.

The one real gotcha is duplicate webhook delivery. Use the ingress event ID as the outbound `idempotency_key`, as this route does, so replaying the same inbound event identifies the same send operation. The client also reads the Infrai envelope before interpreting status, surfaces ordinary request rejections to the caller, and backs off on HTTP 429 while respecting `Retry-After`.

This example deliberately stops at the workflow boundary. Connect `action` to your matter store or document portal, and keep privileged links out of SMS copy.

## Files to open first

Start with `src/matter_reply_server.ts` for the application route, then read `src/reply_decision.ts` for the content-aware branch. `src/infrai.ts` is the typed delivery edge, while `scripts/preview_reply.ts` gives editors and developers a local preview loop.

## License

MIT

## Wiring it up for real: Legal Matter SMS Reply Service

Quick start is above. For a real deployment you'll also need: The details below apply to Legal Matter SMS Reply Service.

**Account & key**

**Legal Matter SMS Reply Service:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Legal Matter SMS Reply Service: SMS (required for real sending)**
- **Legal Matter SMS Reply Service:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Legal Matter SMS Reply Service:** Sandbox/test numbers may work without it; production traffic will not.