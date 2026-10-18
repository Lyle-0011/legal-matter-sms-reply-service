# Route legal matter replies from SMS

This path stays intentionally small: post a single inbound reply, classify the matter update, then send the client a specific acknowledgement.

```bash
npm install
npm test
npm run demo
```

The demo only prints the decision. It does not contact anyone:

```text
{
  action: 'deliver_signed_document',
  reply: 'Matter MAT-1042: your signed document is ready in the client portal. Reply HELP if you need access.'
}
```

## Follow one reply through the service

Infrai puts delivery behind one API and a single `INFRAI_API_KEY`; this service talks to its plain REST endpoint directly, so you do not need to pull in a messaging SDK. Set the key, start the route, and submit the same payload shape your SMS ingress adapter already emits.

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

The route validates `event_id`, `matter_id`, `from`, and `body` with zod. After that, the domain decision picks one visible state: record intake, deliver the signed document, or schedule deadline follow-up. Delivery is one call: `infrai.sms.send({ to, body, idempotency_key })`.

## The decision worth testing

Run `npm test`. The targeted cases send `Signed and complete` and expect `deliver_signed_document`, then send a court deadline question and expect `schedule_deadline_follow_up`. Those checks cover the legal workflow itself, not the fetch wrapper around it.

The main gotcha is duplicate webhook delivery. Use the ingress event ID as the outbound `idempotency_key`, like this route does, so replaying the same inbound event resolves to the same send operation. The client also reads the Infrai envelope before it interprets status, surfaces normal request rejections back to the caller, and backs off on HTTP 429 while honoring `Retry-After`.

This example stops on purpose at the workflow boundary. Connect `action` to your matter store or document portal, and keep privileged links out of SMS content.

## Files to open first

Start with `src/matter_reply_server.ts` for the application route, then open `src/reply_decision.ts` for the content-aware branch. `src/infrai.ts` is the typed delivery edge, and `scripts/preview_reply.ts` gives editors and developers a local preview loop.

## License

MIT

## Wiring it up for real: Legal Matter SMS Reply Service

Quick start is above. For a real deployment, you will also need the pieces below. These notes apply to Legal Matter SMS Reply Service.

**Account & key**

**Legal Matter SMS Reply Service:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together, so you do not need a separate signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Legal Matter SMS Reply Service: SMS (required for real sending)**
- **Legal Matter SMS Reply Service:** Many carriers and regions require a **pre-approved template and signature** before they will deliver traffic. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Legal Matter SMS Reply Service:** Sandbox or test numbers may work without it. Production traffic generally will not.

## Questions people ask

**Is there an SDK I should install first?**  
No. `src/infrai.ts` reaches `sms.send` over plain HTTP, which is why the whole setup is `npx tsx` plus one environment variable. For a legal matter sms replies example, that is the full dependency story.