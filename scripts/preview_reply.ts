import { decideMatterReply, inboundReplySchema } from "../src/reply_decision.js";

const sample = inboundReplySchema.parse({
  event_id: "evt-demo-42",
  matter_id: "MAT-1042",
  from: "+15550101001",
  body: "I signed the agreement",
});

console.log(decideMatterReply(sample));
