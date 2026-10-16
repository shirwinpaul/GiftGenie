# Gift Genie — Progress

Source of truth: `PROJECT_SPEC.md` (a byte-for-byte copy of the original `PROJECT_SPEC (2).md`).
Verify every phase with: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`
(or all at once: `npm run check`).

## Status

| Phase | Status |
| ----- | ------ |
| 1. Setup, env, theme, layout, landing, Settings (BYOK) | ✅ Done |
| 2. Countries, currency, budgets, retailer links | ✅ Done |
| 3. Wizard steps 1–9 | ✅ Done |
| 4. AI layer + ideas route | ✅ Done |
| 5. Results screen | ✅ Done |
| 6. On-demand calls (card, more, refine) | ✅ Done |
| 7. My Gift List + Upcoming occasions | ✅ Done |
| 8. Polish, tests, README | ✅ Done |
| 9. End-to-end check (MOCK_AI=true) | ✅ Done |

**Next:** add real keys to `.env.local` and try the app with the real AI (see README).

## Phase log

### Phase 1 — Setup ✅
- Next.js 16.4.2 (App Router, Turbopack, `cacheComponents` + `partialPrefetching` as the
  official template ships them), React 19, TypeScript strict, Tailwind v4, Framer Motion,
  Zod 4, canvas-confetti, Vitest 5, `@google/genai`.
- `.env.example` + `.env.local` (placeholders only). `.gitignore` ignores `.env` and `.env*.local`.
- `src/config/ai.ts`: all model IDs/limits. Theme tokens in `src/app/globals.css`
  (royal purple, teal, gold; `.dark` class variant). Fonts: Fredoka, Inter, Noto Sans Tamil,
  Noto Sans Devanagari.
- Layout with header (theme toggle, Settings, My Gift List), footer ("Built by Anand Raj").
- Landing page: hero + lamp SVG, tagline, How it works, Modes, Honest prices.
- Settings dialog: BYOK Gemini key stored only in localStorage (`gg:byok-gemini`).

### Phase 2 — Countries, currency, budgets, links ✅
- `src/data/countries.ts`: 249 countries/territories (code, name, flag, currency), sorted.
- `src/lib/locale.ts`: country from `navigator.language` (region, then language), fallback IN.
- `src/lib/currency.ts`: `formatMoney` / `formatRange` (Intl, whole units, safe for unknown codes).
- `src/config/budgets.ts`: presets for INR, USD, GBP, EUR, AED, SGD, CAD, AUD, MYR, LKR.
- `src/config/retailers.ts` + `src/lib/links.ts`: search links (IN: Amazon.in + Flipkart;
  US/UK: Amazon + Etsy; others: local Amazon if any + Etsy) + Google Shopping always.
- `src/lib/group.ts`: per-person share (rounded up), clamp 2–30, combined budget.
- Tests: countries, locale, currency, budgets, links, group share (43 passing).

### Phase 3 — Wizard ✅
- `/find` page → `FindFlow` → `Wizard` with 9 steps (`src/components/wizard/steps/*`).
- Progress bar, animated slide transitions (Framer Motion, reduced-motion respected via
  `MotionConfig reducedMotion="user"`), Back/Next, Enter = Next (form submit), Start over,
  focus moves to each step heading.
- Answers + current step persisted in localStorage (`useAnswers`), sanitized on load.
- Pure logic in `src/lib/answers.ts` (step validation, `toGiftInput`, country/currency reset).
- `src/lib/schemas.ts`: API input schemas + strict AI output schemas.
- Group size uses a 2–30 dropdown (a free text box clamped on every keystroke).

### Phase 4 — AI layer ✅
- `src/lib/ai/`: `gemini.ts` (SDK, JSON mime type, minimal thinking, abort timeout),
  `groq.ts` (fetch, `json_object`, token estimate + in-memory TPM window), `run.ts`
  (retry/fallback runner), `errors.ts` (error kinds, retry-after parsing, user messages),
  `mock.ts` (MOCK_AI canned, input-aware data), `service.ts` (wires everything).
- Flow per user action: Gemini → (429 with retry-after ≤10s: wait + 1 retry) → (invalid
  JSON/schema: 1 retry with the Zod error appended) → Groq (same validation retry).
  Falls back on 5xx, timeout (30s), daily quota, invalid output. Whole chain stops at 55s
  (route `maxDuration = 60`).
- `src/lib/prompts.ts`: compact system prompts with an injection guard; user text cleaned
  and wrapped in `<user_data>`.
- `src/lib/modeRules.ts`: rule check (DIY/experience minimums, last-minute, avoid list →
  one corrective retry) + post-processing in code (filters, over-budget flag, minors safety,
  dedupe, ids).
- `src/lib/api.ts`: per-IP rate limit (40/hour), 16 KB body limit, Zod input validation,
  BYOK header check. Route: `POST /api/ideas` (`initial` | `refine` | `more`).
- Tests: schemas, runner (retry-after, fallback, validation retry, logging), error mapping,
  Groq token budget, prompts/injection guard, mode rules (107 passing).
- Smoke-tested `/api/ideas` on the dev server with `MOCK_AI=true`.

### Phase 5 — Results screen ✅
- `ResultsView`: wobbling gift box → lid pops → confetti (skipped for reduced motion) →
  summary + idea cards with a staggered flip-in. Filter chips (with counts) + sort select.
- `IdeaCard`: category emoji, title, why it fits, "Estimated" range, "Slightly over budget"
  badge, wow stars, where/presentation tip, DIY expander, group share + "Ask friends on
  WhatsApp", buttons: 🛒 Shops (country links + Google Shopping), ✍️ Card, ⭐ Save, 📤 Share.
- Bottom actions: More ideas, Refine chips, Edit answers, Start over + price disclaimer.
- `FindFlow`: in-flight guard (one click = one AI call), results persisted in localStorage,
  friendly `ErrorNotice` with live countdown (rate limit) or Settings button (daily quota /
  bad key). Answers are never lost on errors.

### Phase 6 — On-demand calls ✅
- `POST /api/card` + `CardMessageDialog`: 5 tones × 3 languages, 3 options, copy, save the
  message with the idea; results cached per tone+language (no repeat calls).
- More ideas (4, excluding every title already shown) and Refine (fresh 8) through
  `/api/ideas`.
- Tests: filters/sort, share texts, saved list, full service in MOCK_AI mode for both
  Phase 9 scenarios (118 passing).

### Phase 7 — My Gift List ✅
- `/list`: saved ideas grouped by person + occasion, card messages shown with copy/delete,
  per-idea delete, "Clear all" with a confirmation dialog, "Share list on WhatsApp"
  (plain text via `wa.me/?text=`).
- Upcoming occasions: person, occasion, date, "repeats every year", days remaining
  (`src/lib/reminders.ts`), stored in localStorage. Tests added (123 passing).

### Phase 8 — Polish ✅
- Reviewed screenshots at 1280px and 360px, in light and dark mode. README written, with
  screenshots in `docs/`.
- Verified that `.env.local` is git-ignored and that no API keys appear in project files.
  `npm run check` passes (123 tests).

### Phase 9 — End-to-end ✅ (2026-10-16)
- Ran a Playwright script (scratchpad only, Edge browser, not a project dependency) against
  `next dev` with `MOCK_AI=true` set as a process environment variable. `.env.local` was not
  changed and still has `MOCK_AI=false`.
- (a) India / Mom "Amma" / Birthday / ₹0–2,000 / DIY + Experience / Tamil card. Checked:
  8 ideas, ≥2 DIY and ≥2 experiences, Estimated labels, over-budget badge, filters, sort,
  DIY expander, Amazon.in + Flipkart + Google links, WhatsApp share, save, 3 Tamil-script
  messages saved with the idea, More ideas (8→12), Refine "Cheaper", Gift List grouping,
  reminders, Clear all with confirmation.
- (b) US (picked by search) / Friend / Graduation / $15–30 / Last-minute + group of 4 /
  English. Checked: all ideas last-minute, each person's share, "Ask friends on WhatsApp"
  text, Amazon.com + Etsy + Google links, card messages, dark mode (kept after reload),
  results kept after reload, no horizontal scroll at 360px, Settings (BYOK) dialog.
- All checks passed with no console errors.

## Decisions
- **Models** (checked against official docs, Oct 2026): Gemini `gemini-3.6-flash`
  (free tier, `thinkingLevel: MINIMAL`); Groq `openai/gpt-oss-120b` (free tier, 8K TPM,
  `reasoning_effort: low`). Groq is called with plain `fetch` (OpenAI-compatible API).
- `@types/node` pinned to ^22 (Vitest 5 peer requirement).
- `typecheck` runs `next typegen` first (needed for the global `LayoutProps` types).
- localStorage access goes through `src/lib/storage.ts` + `useStoredValue`
  (`useSyncExternalStore`, so no hydration mismatch and no setState-in-effect).
- Theme is applied before paint by a tiny inline script in `layout.tsx`.
