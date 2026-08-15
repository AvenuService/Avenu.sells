export type JournalPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: string[];
};

export const journalPosts: JournalPost[] = [
  {
    slug: "inside-the-icy-palette",
    title: "Inside the icy palette",
    date: "2024-09-12",
    excerpt:
      "How we built a single color language across software, audio, and apparel, and why restraint ships faster than polish.",
    body: [
      "Every surface at Avenu — the site, the packaging insert, the download cards, even the Discord — runs off the same six-color ramp. That constraint started as a visual choice and ended up being a product decision: fewer palettes means fewer decisions, and fewer decisions means faster drops.",
      "For digital goods this matters most. A preset pack or a texture set has no physical tolerance to fall back on — the only thing holding it together is consistency of tone. So the palette became the brand language, not just the brand color.",
      "We still break the rule sometimes. The exceptions are always deliberate, and they always ship with a note about why.",
    ],
  },
  {
    slug: "why-digital-first",
    title: "Why digital first, not everything",
    date: "2024-08-03",
    excerpt:
      "The catalog is tight on purpose. Here is the shortlist of problems a small crew should solve before anything else.",
    body: [
      "Physical goods are delightful to unbox and expensive to get wrong. Digital goods arrive instantly and are impossible to recall. For a crew of our size, that tradeoff tilts hard toward digital — software, presets, audio, studio templates.",
      "We kept one physical line (apparel) because it anchors the brand and pays for itself in shelf presence, not volume. Everything else ships as an instant-access key or download.",
      "This is not a pivot. It is the shape the catalog settles into when you stop asking every category to carry its weight and start asking each product to justify its existence.",
    ],
  },
];

export function getJournalPost(slug: string): JournalPost | undefined {
  return journalPosts.find((p) => p.slug === slug);
}
