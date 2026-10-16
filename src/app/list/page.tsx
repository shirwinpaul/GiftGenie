import type { Metadata } from "next";
import { GiftList } from "@/components/list/GiftList";

export const metadata: Metadata = {
  title: "My Gift List — Gift Genie",
};

export default function ListPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-4xl font-semibold text-royal-800 dark:text-royal-100">⭐ My Gift List</h1>
      <p className="muted mb-6">Saved only in this browser — nothing is stored on our server.</p>
      <GiftList />
    </div>
  );
}
