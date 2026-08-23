import assert from "node:assert/strict";
import test from "node:test";
import { decideMatterReply } from "../src/reply_decision.js";

test("a signed reply selects document delivery", () => {
  const result = decideMatterReply({
    event_id: "evt-17",
    matter_id: "MAT-1042",
    from: "+15550101001",
    body: "Signed and complete",
  });

  assert.equal(result.action, "deliver_signed_document");
  assert.match(result.reply, /signed document is ready/);
});

test("a court-date question selects deadline follow-up", () => {
  const result = decideMatterReply({
    event_id: "evt-18",
    matter_id: "MAT-1043",
    from: "+15550101002",
    body: "When is my court deadline?",
  });

  assert.equal(result.action, "schedule_deadline_follow_up");
});
