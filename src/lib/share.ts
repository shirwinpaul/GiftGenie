import { formatMoney, formatRange } from "./currency";
import { groupShare } from "./group";
import type { Idea } from "./schemas";

export interface ShareContext {
  person: string; // nickname, or relationship
  occasion: string;
  currency: string;
}

/** "Mom's", "James'" — simple English possessive. */
export function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

export function ideaShareText(idea: Idea, ctx: ShareContext): string {
  return [
    `🎁 Gift idea for ${possessive(ctx.person)} ${ctx.occasion}: ${idea.title}`,
    `Est. ${formatRange(idea.priceMin, idea.priceMax, ctx.currency)} — ${idea.whyItFits}`,
    "Found with Gift Genie ✨",
  ].join("\n");
}

/** The "📤 Ask friends on WhatsApp" message for group gifts. */
export function groupAskText(idea: Idea, ctx: ShareContext, people: number): string {
  const share = groupShare(idea.priceMin, idea.priceMax, people);
  const each =
    share.min === share.max
      ? formatMoney(share.max, ctx.currency)
      : `${formatMoney(share.min, ctx.currency)}–${formatMoney(share.max, ctx.currency)}`;
  return `Let's get ${idea.title} for ${possessive(ctx.person)} ${ctx.occasion}! It's about ${each} each (${share.people} of us).`;
}
