import type { Metadata, Viewport } from "next";
import { Fredoka, Inter, Noto_Sans_Devanagari, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { STORAGE_KEYS } from "@/lib/storage";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const notoTamil = Noto_Sans_Tamil({ variable: "--font-noto-tamil", subsets: ["tamil"] });
const notoDeva = Noto_Sans_Devanagari({ variable: "--font-noto-deva", subsets: ["devanagari"] });

export const metadata: Metadata = {
  title: "Gift Genie — AI Gift Idea Finder",
  description:
    "Never wonder what to gift again. Personalised gift ideas with honest estimated prices, DIY steps, experiences and card messages.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1ff" },
    { media: "(prefers-color-scheme: dark)", color: "#1d0b40" },
  ],
};

// Applies the saved theme before first paint so dark mode never flashes light.
const themeScript = `try{if(JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEYS.theme,
)}))==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fredoka.variable} ${inter.variable} ${notoTamil.variable} ${notoDeva.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-royal-800"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
