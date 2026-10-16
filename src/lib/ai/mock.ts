/**
 * MOCK_AI mode (development only): canned but input-aware responses so the whole app
 * can be tested without using any AI quota. Output goes through the same Zod validation
 * and post-processing as real AI output.
 */
import type { LanguageId, RefinementId, ToneId } from "@/config/options";
import { effectiveBudget } from "@/lib/prompts";
import type { AiIdea, ParsedGiftInput } from "@/lib/schemas";
import type { AIProvider } from "./types";

type Category = AiIdea["category"];

const TEMPLATES: Record<Category, { title: (i: string) => string; where: AiIdea["whereToGet"]; quick: boolean }[]> = {
  Thing: [
    { title: (i) => `Curated ${i} surprise box`, where: "Online", quick: false },
    { title: (i) => `Personalised ${i} keepsake`, where: "Online", quick: false },
    { title: (i) => `${i} starter kit from a local store`, where: "Local shop", quick: true },
    { title: (i) => `Premium ${i} accessory`, where: "Local shop", quick: true },
  ],
  Experience: [
    { title: (i) => `${i} workshop for two`, where: "Book online", quick: false },
    { title: (i) => `Same-day ${i} outing`, where: "Book online", quick: true },
    { title: (i) => `${i} class membership`, where: "Book online", quick: false },
  ],
  DIY: [
    { title: (i) => `Handmade ${i} memory jar`, where: "Make it yourself", quick: true },
    { title: (i) => `DIY ${i} photo scrapbook`, where: "Make it yourself", quick: false },
    { title: (i) => `Hand-painted ${i} card set`, where: "Make it yourself", quick: true },
  ],
  Digital: [
    { title: (i) => `Online ${i} masterclass`, where: "Online", quick: true },
    { title: (i) => `${i} e-book & audio bundle`, where: "Online", quick: true },
    { title: (i) => `${i} app subscription e-gift`, where: "Online", quick: true },
  ],
};

const REFINE_PREFIX: Record<RefinementId, string> = {
  cheaper: "Budget-friendly",
  unique: "One-of-a-kind",
  personal: "Heartfelt",
  practical: "Everyday",
  fun: "Playful",
};

function plan(input: ParsedGiftInput, count: number): Category[] {
  const cats: Category[] = [];
  const need = count >= 8 ? 2 : 1;
  if (input.modes.diy) cats.push(...Array<Category>(need).fill("DIY"));
  if (input.modes.experience) cats.push(...Array<Category>(need).fill("Experience"));
  const filler: Category[] = input.modes.lastMinute
    ? ["Digital", "Thing", "Experience", "Digital", "Thing"]
    : ["Thing", "Digital", "Thing", "Experience", "Thing", "Digital"];
  let i = 0;
  while (cats.length < count) cats.push(filler[i++ % filler.length]);
  return cats.slice(0, count);
}

export function mockIdeas(
  input: ParsedGiftInput,
  opts: { count: number; refinement?: RefinementId; exclude?: string[]; seed?: number },
): { summary: string; ideas: AiIdea[] } {
  const budget = effectiveBudget(input);
  const exclude = new Set((opts.exclude ?? []).map((t) => t.toLowerCase()));
  const used = new Map<Category, number>();
  const ideas: AiIdea[] = [];
  const categories = plan(input, opts.count);
  const priceScale = opts.refinement === "cheaper" ? 0.5 : 1;
  const offset = opts.seed ?? exclude.size;
  let attempt = offset;

  for (let n = 0; n < categories.length && attempt < 200; attempt++) {
    const category = categories[n];
    const options = TEMPLATES[category].filter((t) => !input.modes.lastMinute || t.quick);
    const k = used.get(category) ?? 0;
    const template = options[(k + attempt) % options.length];
    const interest = input.interests[(n + offset) % input.interests.length];
    const prefix = opts.refinement ? `${REFINE_PREFIX[opts.refinement]} ` : "";
    const title = `${prefix}${template.title(interest)}`.replace(/^./, (c) => c.toUpperCase());
    if (exclude.has(title.toLowerCase()) || ideas.some((i) => i.title === title)) continue;
    used.set(category, k + 1);

    // Spread prices across the budget; the 3rd idea is slightly over (to show the badge).
    const span = Math.max(1, budget.max - budget.min);
    const lo = Math.round((budget.min + span * (0.1 + 0.1 * (n % 5))) * priceScale);
    const slightlyOver = n === 2 && !opts.refinement;
    const hi = slightlyOver ? Math.round(budget.max * 1.1) : Math.min(budget.max, Math.round(lo + span * 0.3));
    const isDiy = category === "DIY";

    ideas.push({
      title,
      category,
      whyItFits: `Perfect for a ${input.personality[0]?.toLowerCase() ?? "special"} ${input.relationship.toLowerCase()} who loves ${interest.toLowerCase()} — a thoughtful touch for their ${input.occasion}.`,
      priceMin: isDiy ? Math.round(lo * 0.4) : lo,
      priceMax: isDiy ? Math.round(Math.max(lo, hi) * 0.6) : Math.max(lo, hi),
      overBudget: slightlyOver,
      searchPhrase: template.title(interest).toLowerCase(),
      whereToGet: template.where,
      lastMinuteFriendly: input.modes.lastMinute ? true : template.quick,
      diy: isDiy
        ? {
            materials: ["Glass jar or notebook", "Coloured paper", "Ribbon", "Glue & markers", `Photos or notes about ${interest}`],
            steps: [
              "Collect 10–15 small memories or photos.",
              `Decorate the base with a ${interest.toLowerCase()} theme.`,
              "Write a short note for each memory.",
              "Assemble everything neatly.",
              "Finish with a ribbon and a name tag.",
            ],
            timeNeeded: input.modes.lastMinute ? "About 1.5 hours" : "2–3 hours",
            materialCostMin: Math.round(lo * 0.4),
            materialCostMax: Math.round(Math.max(lo, hi) * 0.6),
          }
        : null,
      presentationTip: "Wrap it in teal tissue with a gold ribbon and a handwritten tag.",
      wowFactor: ((n + attempt) % 5) + 1,
    });
    n++;
  }

  return {
    summary: `A ${input.personality[0]?.toLowerCase() ?? "wonderful"} ${input.relationship.toLowerCase()} who loves ${input.interests
      .slice(0, 2)
      .join(" and ")
      .toLowerCase()} — let's make this ${input.occasion} special! (Mock mode)`,
    ideas,
  };
}

const CARD_TEXT: Record<LanguageId, Record<ToneId, string[]>> = {
  en: {
    heartfelt: ["Wishing you a {occ} as warm as your heart, {name}. You mean the world to me.", "{name}, thank you for every smile you bring. Happy {occ}, with all my love.", "Some people make life brighter just by being in it. That's you, {name}. Happy {occ}!"],
    funny: ["Happy {occ}, {name}! I'd have got you a unicorn, but they were out of stock.", "{name}, you're not getting older, you're getting more legendary. Happy {occ}!", "Happy {occ}! Gift inside. Expectations managed. Love unlimited, {name}."],
    short: ["Happy {occ}, {name}! 💛", "So glad you exist, {name}. Happy {occ}!", "Big hugs on your {occ}, {name}!"],
    formal: ["Dear {name}, warmest wishes on this {occ}. With sincere regards.", "Dear {name}, please accept this small token of appreciation on your {occ}.", "Wishing you joy and success on this {occ}, {name}. Kind regards."],
    poetic: ["Like stars that light the evening sky, you shine, {name}. Happy {occ}.", "A little gift, a lot of heart — happy {occ}, {name}, from the very start.", "May your {occ} bloom like spring, {name}, and joy be everything."],
  },
  ta: {
    heartfelt: ["அன்புள்ள {name}, உங்கள் {occ} மகிழ்ச்சியாக அமையட்டும். நீங்கள் என் வாழ்வின் ஒளி.", "{name}, நீங்கள் தரும் ஒவ்வொரு புன்னகைக்கும் நன்றி. இனிய {occ} வாழ்த்துக்கள்!", "உங்கள் அன்பு என்றும் எனக்கு பலம், {name}. இனிய {occ}!"],
    funny: ["இனிய {occ}, {name}! யானை வாங்க நினைத்தேன், கடையில் இல்லை!", "{name}, வயது ஏறவில்லை, கெத்து ஏறுகிறது! இனிய {occ}!", "பரிசு சின்னது, அன்பு பெரியது, {name}! இனிய {occ}!"],
    short: ["இனிய {occ}, {name}! 💛", "எப்போதும் மகிழ்ச்சியாக இருங்கள், {name}!", "அன்புடன் வாழ்த்துக்கள், {name}!"],
    formal: ["மதிப்பிற்குரிய {name}, உங்கள் {occ} அன்று என் மனமார்ந்த வாழ்த்துக்கள்.", "அன்புள்ள {name}, இந்த சிறிய பரிசை அன்புடன் ஏற்றுக்கொள்ளுங்கள்.", "{name}, உங்களுக்கு வெற்றியும் மகிழ்ச்சியும் உண்டாகட்டும்."],
    poetic: ["வானில் மின்னும் நட்சத்திரம் போல் நீங்கள் ஒளிர்கிறீர்கள், {name}.", "பூக்கள் மலர்வது போல் உங்கள் {occ} மலரட்டும், {name}.", "சிறு பரிசு, பெரும் அன்பு — இனிய {occ}, {name}."],
  },
  hi: {
    heartfelt: ["प्यारे {name}, आपका {occ} खुशियों से भरा हो। आप मेरे लिए बहुत खास हैं।", "{name}, हर मुस्कान के लिए शुक्रिया। {occ} की ढेरों शुभकामनाएँ!", "आपका प्यार मेरी ताकत है, {name}। {occ} मुबारक हो!"],
    funny: ["{occ} मुबारक, {name}! हाथी लाना था, पर दुकान पर नहीं मिला!", "{name}, उम्र नहीं, आपका स्वैग बढ़ रहा है! {occ} मुबारक!", "तोहफ़ा छोटा, प्यार बड़ा, {name}! {occ} की बधाई!"],
    short: ["{occ} मुबारक, {name}! 💛", "हमेशा खुश रहो, {name}!", "ढेर सारा प्यार, {name}!"],
    formal: ["आदरणीय {name}, {occ} के अवसर पर हार्दिक शुभकामनाएँ।", "प्रिय {name}, कृपया यह छोटा सा उपहार स्वीकार करें।", "{name}, आपको सफलता और खुशियाँ मिलें। सादर।"],
    poetic: ["आसमान के तारों जैसे चमकते रहो, {name}।", "फूलों सी खिले आपकी {occ}, {name}।", "छोटा सा तोहफ़ा, दिल से भरा — {occ} मुबारक, {name}।"],
  },
};

export function mockCardMessages(input: ParsedGiftInput, tone: ToneId, language: LanguageId): { messages: string[] } {
  const name = input.nickname || input.relationship;
  return {
    messages: CARD_TEXT[language][tone].map((t) => t.replaceAll("{name}", name).replaceAll("{occ}", input.occasion)),
  };
}

/** Wraps a canned JSON builder as a provider, with a short delay to show the loading screen. */
export function createMockProvider(build: () => unknown, delayMs = 900): AIProvider {
  return {
    name: "mock",
    async generate() {
      await new Promise((r) => setTimeout(r, delayMs));
      return JSON.stringify(build());
    },
  };
}
