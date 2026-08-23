import { z } from "zod";

export const inboundReplySchema = z.object({
  event_id: z.string().min(1),
  matter_id: z.string().min(1),
  from: z.string().min(7),
  body: z.string().trim().min(1).max(500),
});

export type InboundReply = z.infer<typeof inboundReplySchema>;

export type ReplyDecision = {
  action: "record_intake" | "deliver_signed_document" | "schedule_deadline_follow_up";
  reply: string;
};

export function decideMatterReply(input: InboundReply): ReplyDecision {
  const normalized = input.body.toLowerCase();

  if (/\b(signed|executed|complete)\b/.test(normalized)) {
    return {
      action: "deliver_signed_document",
      reply: `Matter ${input.matter_id}: your signed document is ready in the client portal. Reply HELP if you need access.`,
    };
  }

  if (/\b(deadline|due|hearing|court)\b/.test(normalized)) {
    return {
      action: "schedule_deadline_follow_up",
      reply: `Matter ${input.matter_id}: we recorded your deadline question. The legal team will confirm the date and next step.`,
    };
  }

  return {
    action: "record_intake",
    reply: `Matter ${input.matter_id}: we added your message to intake. A team member will review it and reply.`,
  };
}
