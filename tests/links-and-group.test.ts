import { describe, expect, it } from "vitest";
import { buildSearchLinks, whatsappLink } from "@/lib/links";
import { clampPeople, combinedBudget, groupShare } from "@/lib/group";

describe("retailer link builder", () => {
  it("India → Amazon.in, Flipkart, Google Shopping", () => {
    const links = buildSearchLinks("handmade coffee mug", "IN");
    expect(links.map((l) => l.name)).toEqual(["Amazon.in", "Flipkart", "Google Shopping"]);
    expect(links[0].href).toBe("https://www.amazon.in/s?k=handmade%20coffee%20mug");
  });

  it("US and UK → Amazon + Etsy + Google Shopping", () => {
    expect(buildSearchLinks("x", "US").map((l) => l.name)).toEqual(["Amazon.com", "Etsy", "Google Shopping"]);
    expect(buildSearchLinks("x", "GB").map((l) => l.name)).toEqual(["Amazon.co.uk", "Etsy", "Google Shopping"]);
  });

  it("other countries use their Amazon where one exists", () => {
    expect(buildSearchLinks("x", "DE").map((l) => l.name)).toEqual(["Amazon.de", "Etsy", "Google Shopping"]);
  });

  it("countries without Amazon fall back to Etsy + Google Shopping", () => {
    const links = buildSearchLinks("tea set", "KE");
    expect(links.map((l) => l.name)).toEqual(["Etsy", "Google Shopping"]);
    expect(links[1].href).toContain("gl=KE");
  });

  it("URL-encodes special characters", () => {
    const [amazon] = buildSearchLinks("mom & dad's 50% off #1 mug?", "US");
    expect(amazon.href).toBe("https://www.amazon.com/s?k=mom%20%26%20dad's%2050%25%20off%20%231%20mug%3F");
    const google = buildSearchLinks("café ☕", "FR").at(-1)!;
    expect(google.href).toContain("q=caf%C3%A9%20%E2%98%95");
  });

  it("builds a WhatsApp link", () => {
    expect(whatsappLink("Hi & bye")).toBe("https://wa.me/?text=Hi%20%26%20bye");
  });
});

describe("group gift share", () => {
  it("splits and rounds up so the total is covered", () => {
    expect(groupShare(1000, 2000, 4)).toEqual({ people: 4, min: 250, max: 500 });
    const s = groupShare(100, 101, 3);
    expect(s).toEqual({ people: 3, min: 34, max: 34 });
    expect(s.max * 3).toBeGreaterThanOrEqual(101);
  });

  it("clamps people to 2–30", () => {
    expect(clampPeople(1)).toBe(2);
    expect(clampPeople(31)).toBe(30);
    expect(clampPeople(Number.NaN)).toBe(2);
    expect(groupShare(300, 300, 50).people).toBe(30);
    expect(groupShare(300, 300, 30)).toEqual({ people: 30, min: 10, max: 10 });
    expect(groupShare(300, 300, 2)).toEqual({ people: 2, min: 150, max: 150 });
  });

  it("combined budget multiplies the per-person budget", () => {
    expect(combinedBudget(20, 50, 4)).toEqual({ min: 80, max: 200 });
  });
});
