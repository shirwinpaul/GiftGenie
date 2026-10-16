import type { Metadata } from "next";
import { FindFlow } from "@/components/find/FindFlow";

export const metadata: Metadata = {
  title: "Find a gift — Gift Genie",
};

export default function FindPage() {
  return <FindFlow />;
}
