import Link from "next/link";
import { LampIllustration } from "@/components/illustrations/Lamp";
import { GiftBox } from "@/components/illustrations/GiftBox";

const STEPS = [
  { icon: "💬", title: "Tell us about them", text: "Who they are, what they love, the occasion and your budget." },
  { icon: "🧞", title: "The genie thinks", text: "AI suggests 8 thoughtful ideas, each with a reason it fits." },
  { icon: "🎁", title: "Pick, save & share", text: "Search shops, write a card message, or ask friends to chip in." },
];

const MODES = [
  { icon: "⚡", title: "Last-minute", text: "Only ideas you can get today: local shops, e-gifts and quick makes." },
  { icon: "✂️", title: "DIY", text: "Handmade ideas with a materials list, simple steps and time needed." },
  { icon: "🎟️", title: "Experiences", text: "Classes, workshops, events, trips and memberships." },
  { icon: "👥", title: "Group gift", text: "Pool your budget with friends and see each person’s share." },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="grid items-center gap-6 py-10 sm:py-16 md:grid-cols-2">
        <div className="text-center md:text-left">
          <p className="mb-3 inline-block rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-900 dark:bg-teal-900/60 dark:text-teal-100">
            Free AI gift idea finder
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-royal-800 sm:text-5xl dark:text-royal-100">
            Never wonder what to gift again 🎁✨
          </h1>
          <p className="muted mt-4 text-lg">
            Describe the person and the occasion. Gift Genie finds personal ideas, not generic ones,
            with honest estimated prices and shopping links for your country.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link href="/find" className="btn-primary px-7 text-lg">
              🧞 Find a gift
            </Link>
            <Link href="/list" className="btn-secondary">
              ⭐ My Gift List
            </Link>
          </div>
        </div>
        <div className="mx-auto w-full max-w-sm animate-float">
          <LampIllustration className="h-auto w-full drop-shadow-xl" />
        </div>
      </section>

      <section aria-labelledby="how" className="py-8">
        <h2 id="how" className="mb-6 text-center text-3xl font-semibold text-royal-800 dark:text-royal-100">
          How it works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card p-5 text-center">
              <div className="text-4xl" aria-hidden>
                {s.icon}
              </div>
              <h3 className="mt-2 text-lg font-semibold">
                {i + 1}. {s.title}
              </h3>
              <p className="muted mt-1 text-sm">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="modes" className="py-8">
        <h2 id="modes" className="mb-6 text-center text-3xl font-semibold text-royal-800 dark:text-royal-100">
          Magic modes
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((m) => (
            <li key={m.title} className="card p-5">
              <div className="text-3xl" aria-hidden>
                {m.icon}
              </div>
              <h3 className="mt-2 text-lg font-semibold">{m.title}</h3>
              <p className="muted mt-1 text-sm">{m.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="honest" className="py-8">
        <div className="card flex flex-col items-center gap-4 p-6 sm:flex-row">
          <GiftBox className="h-20 w-20 shrink-0" />
          <div>
            <h2 id="honest" className="text-2xl font-semibold text-royal-800 dark:text-royal-100">
              Honest prices
            </h2>
            <p className="muted mt-1">
              The genie can’t see live prices or stock. Every price is an <strong>estimated range</strong>{" "}
              in your currency, ideas stay within your budget (or are clearly marked “Slightly over
              budget”), and we suggest gift <em>types</em> with search links, not products that might not
              exist. Always check the store before buying.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
