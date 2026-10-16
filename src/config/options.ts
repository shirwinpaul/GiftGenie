/** All choice lists used by the wizard and the results screen. */
export interface Option<T extends string = string> {
  id: T;
  label: string;
  emoji: string;
}

export const OTHER = "other";

export const RELATIONSHIPS: Option[] = [
  { id: "mom", label: "Mom", emoji: "👩" },
  { id: "dad", label: "Dad", emoji: "👨" },
  { id: "friend", label: "Friend", emoji: "🧑‍🤝‍🧑" },
  { id: "best-friend", label: "Best Friend", emoji: "💛" },
  { id: "partner", label: "Partner / Spouse", emoji: "💞" },
  { id: "sister", label: "Sister", emoji: "👧" },
  { id: "brother", label: "Brother", emoji: "👦" },
  { id: "grandparent", label: "Grandparent", emoji: "👵" },
  { id: "teacher", label: "Teacher", emoji: "🍎" },
  { id: "colleague", label: "Colleague / Boss", emoji: "💼" },
  { id: "child", label: "Child", emoji: "🧒" },
  { id: OTHER, label: "Other", emoji: "✨" },
];

export const AGE_RANGES = [
  { id: "0-5", label: "Child (0–5)", emoji: "🍼" },
  { id: "6-12", label: "Kid (6–12)", emoji: "🪁" },
  { id: "13-17", label: "Teen (13–17)", emoji: "🎧" },
  { id: "18-25", label: "Young adult (18–25)", emoji: "🎓" },
  { id: "26-40", label: "Adult (26–40)", emoji: "🧑" },
  { id: "41-60", label: "Adult (41–60)", emoji: "🧑‍🦱" },
  { id: "60+", label: "Senior (60+)", emoji: "🧓" },
] as const satisfies readonly Option[];
export type AgeRangeId = (typeof AGE_RANGES)[number]["id"];
export const AGE_IDS = AGE_RANGES.map((a) => a.id) as [AgeRangeId, ...AgeRangeId[]];
/** Age ranges that are minors: strict child-safety rules apply. */
export const MINOR_AGES: readonly AgeRangeId[] = ["0-5", "6-12", "13-17"];

export const GENDERS = [
  { id: "female", label: "Female", emoji: "" },
  { id: "male", label: "Male", emoji: "" },
  { id: "non-binary", label: "Non-binary", emoji: "" },
  { id: "unspecified", label: "Prefer not to say", emoji: "" },
] as const satisfies readonly Option[];
export type GenderId = (typeof GENDERS)[number]["id"];
export const GENDER_IDS = GENDERS.map((g) => g.id) as [GenderId, ...GenderId[]];

export const INTERESTS: Option[] = [
  { id: "Books", label: "Books", emoji: "📚" },
  { id: "Tech & Gadgets", label: "Tech & Gadgets", emoji: "🔌" },
  { id: "Cooking & Food", label: "Cooking & Food", emoji: "🍳" },
  { id: "Sports", label: "Sports", emoji: "⚽" },
  { id: "Fitness", label: "Fitness", emoji: "🏋️" },
  { id: "Music", label: "Music", emoji: "🎵" },
  { id: "Art & Craft", label: "Art & Craft", emoji: "🎨" },
  { id: "Fashion", label: "Fashion", emoji: "👗" },
  { id: "Beauty & Self-care", label: "Beauty & Self-care", emoji: "🧴" },
  { id: "Travel", label: "Travel", emoji: "✈️" },
  { id: "Gaming", label: "Gaming", emoji: "🎮" },
  { id: "Movies & Shows", label: "Movies & Shows", emoji: "🎬" },
  { id: "Photography", label: "Photography", emoji: "📷" },
  { id: "Plants & Gardening", label: "Plants & Gardening", emoji: "🪴" },
  { id: "Pets", label: "Pets", emoji: "🐾" },
  { id: "Spiritual", label: "Spiritual", emoji: "🪔" },
  { id: "Home Decor", label: "Home Decor", emoji: "🛋️" },
  { id: "Coffee & Tea", label: "Coffee & Tea", emoji: "☕" },
  { id: "Outdoors & Adventure", label: "Outdoors & Adventure", emoji: "🏕️" },
  { id: "Learning & Courses", label: "Learning & Courses", emoji: "🧠" },
];
export const MAX_INTERESTS = 12;

export const PERSONALITIES = [
  { id: "Practical", label: "Practical", emoji: "🛠️" },
  { id: "Sentimental", label: "Sentimental", emoji: "💌" },
  { id: "Adventurous", label: "Adventurous", emoji: "🧭" },
  { id: "Minimalist", label: "Minimalist", emoji: "◽" },
  { id: "Fun-loving", label: "Fun-loving", emoji: "🎉" },
  { id: "Creative", label: "Creative", emoji: "💡" },
  { id: "Intellectual", label: "Intellectual", emoji: "🎓" },
  { id: "Homebody", label: "Homebody", emoji: "🏡" },
  { id: "Social butterfly", label: "Social butterfly", emoji: "🦋" },
] as const satisfies readonly Option[];
export type PersonalityId = (typeof PERSONALITIES)[number]["id"];
export const PERSONALITY_IDS = PERSONALITIES.map((p) => p.id) as [PersonalityId, ...PersonalityId[]];

export const OCCASIONS: Option[] = [
  { id: "Birthday", label: "Birthday", emoji: "🎂" },
  { id: "Anniversary", label: "Anniversary", emoji: "💍" },
  { id: "Wedding", label: "Wedding", emoji: "💒" },
  { id: "Graduation", label: "Graduation", emoji: "🎓" },
  { id: "New job", label: "New job", emoji: "💼" },
  { id: "Farewell", label: "Farewell", emoji: "👋" },
  { id: "Thank you", label: "Thank you", emoji: "🙏" },
  { id: "Get well soon", label: "Get well soon", emoji: "🌷" },
  { id: "Housewarming", label: "Housewarming", emoji: "🏠" },
  { id: "Baby shower", label: "Baby shower", emoji: "🍼" },
  { id: "Diwali", label: "Diwali", emoji: "🪔" },
  { id: "Pongal", label: "Pongal", emoji: "🍚" },
  { id: "Christmas", label: "Christmas", emoji: "🎄" },
  { id: "Eid", label: "Eid", emoji: "🌙" },
  { id: "Raksha Bandhan", label: "Raksha Bandhan", emoji: "🧶" },
  { id: "Holi", label: "Holi", emoji: "🌈" },
  { id: "Onam", label: "Onam", emoji: "🌼" },
  { id: "Lunar New Year", label: "Lunar New Year", emoji: "🧧" },
  { id: "Valentine's Day", label: "Valentine's Day", emoji: "💝" },
  { id: "Mother's Day", label: "Mother's Day", emoji: "💐" },
  { id: "Father's Day", label: "Father's Day", emoji: "👔" },
  { id: "Teacher's Day", label: "Teacher's Day", emoji: "🍎" },
  { id: "Friendship Day", label: "Friendship Day", emoji: "🤝" },
  { id: "Just because", label: "Just because", emoji: "😊" },
  { id: OTHER, label: "Other", emoji: "✨" },
];

export const LANGUAGES = [
  { id: "en", label: "English", emoji: "🇬🇧", sample: "Happy birthday!" },
  { id: "ta", label: "தமிழ் (Tamil)", emoji: "🌺", sample: "இனிய பிறந்தநாள் வாழ்த்துக்கள்!" },
  { id: "hi", label: "हिन्दी (Hindi)", emoji: "🪷", sample: "जन्मदिन की हार्दिक शुभकामनाएँ!" },
] as const;
export type LanguageId = (typeof LANGUAGES)[number]["id"];
export const LANGUAGE_IDS = LANGUAGES.map((l) => l.id) as [LanguageId, ...LanguageId[]];
export const LANGUAGE_NAMES: Record<LanguageId, string> = {
  en: "English",
  ta: "Tamil (Tamil script)",
  hi: "Hindi (Devanagari script)",
};

export const TONES = [
  { id: "heartfelt", label: "Heartfelt", emoji: "💖" },
  { id: "funny", label: "Funny", emoji: "😂" },
  { id: "short", label: "Short & sweet", emoji: "🍬" },
  { id: "formal", label: "Formal", emoji: "🎩" },
  { id: "poetic", label: "Poetic", emoji: "🪶" },
] as const satisfies readonly Option[];
export type ToneId = (typeof TONES)[number]["id"];
export const TONE_IDS = TONES.map((t) => t.id) as [ToneId, ...ToneId[]];

export const REFINEMENTS = [
  { id: "cheaper", label: "Cheaper", emoji: "💸" },
  { id: "unique", label: "More unique", emoji: "🦄" },
  { id: "personal", label: "More personal", emoji: "💌" },
  { id: "practical", label: "More practical", emoji: "🛠️" },
  { id: "fun", label: "More fun", emoji: "🎉" },
] as const satisfies readonly Option[];
export type RefinementId = (typeof REFINEMENTS)[number]["id"];
export const REFINEMENT_IDS = REFINEMENTS.map((r) => r.id) as [RefinementId, ...RefinementId[]];

export const CATEGORIES = [
  { id: "Thing", label: "Things", emoji: "🎁" },
  { id: "Experience", label: "Experiences", emoji: "🎟️" },
  { id: "DIY", label: "DIY", emoji: "✂️" },
  { id: "Digital", label: "Digital", emoji: "💻" },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function labelFor(list: readonly Option[], id: string): string {
  return list.find((o) => o.id === id)?.label ?? id;
}
