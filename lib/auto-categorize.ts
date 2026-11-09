// Suggests a category for an imported transaction from its description, such as
// "UPI/412345/SWIGGY INSTAMART@ybl" -> Food. Pure: no database, no clock.
//
// The description is split into lowercase words. A one-word keyword matches a
// word that equals it, or (for keywords of 5+ letters) starts with it, so
// "swiggy" also finds "swiggyinstamart". A phrase such as "prime video" matches
// the words in a row. Rules are tried in order and the first match wins.

type Rule = { category: string; keywords: string[] };

export const CATEGORY_RULES: Rule[] = [
  {
    category: "Subscriptions",
    // Before Entertainment and Shopping so "amazon prime" is not read as either.
    keywords: ["netflix", "spotify", "hotstar", "jiocinema", "zee5", "sonyliv", "prime video", "amazon prime", "youtube premium", "google play", "icloud", "apple music", "subscription", "audible", "linkedin premium"],
  },
  {
    category: "Food",
    keywords: ["swiggy", "zomato", "restaurant", "cafe", "dominos", "mcdonalds", "kfc", "pizza", "burger", "starbucks", "bakery", "biryani", "dhaba", "eatfit", "blinkit", "zepto", "bigbasket", "instamart", "grocery", "groceries", "supermarket", "dmart", "reliance fresh", "more retail", "milk", "chai", "tea", "canteen", "food"],
  },
  {
    category: "Travel",
    keywords: ["uber", "ola", "rapido", "irctc", "redbus", "makemytrip", "goibibo", "cleartrip", "indigo", "airlines", "air india", "vistara", "metro", "fastag", "petrol", "diesel", "fuel", "hpcl", "bpcl", "iocl", "shell", "cab", "taxi", "bus", "train", "toll", "parking"],
  },
  {
    category: "Rent",
    keywords: ["rent", "landlord", "house rent", "pg rent", "nobroker"],
  },
  {
    category: "Bills",
    keywords: ["electricity", "bescom", "tneb", "msedcl", "tata power", "adani electricity", "water bill", "gas", "mahanagar", "indane", "airtel", "jio", "vodafone", "bsnl", "broadband", "fibernet", "recharge", "dth", "tatasky", "dish tv", "insurance", "lic", "bill", "postpaid", "prepaid", "municipal", "maintenance"],
  },
  {
    category: "Health",
    keywords: ["pharmacy", "pharmeasy", "apollo", "medplus", "netmeds", "1mg", "hospital", "clinic", "diagnostic", "diagnostics", "dental", "dentist", "doctor", "medical", "medicine", "lab", "practo", "cult", "gym"],
  },
  {
    category: "Entertainment",
    keywords: ["bookmyshow", "pvr", "inox", "cinema", "movie", "dream11", "steam", "playstation", "xbox", "concert", "amusement", "gaming", "game"],
  },
  {
    category: "Shopping",
    keywords: ["amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho", "decathlon", "lifestyle", "westside", "zara", "uniqlo", "ikea", "croma", "reliance digital", "mall", "shopping", "clothes", "store"],
  },
];

const words = (text: string) => text.toLowerCase().match(/[a-z0-9]+/g) ?? [];

function matches(tokens: string[], keyword: string): boolean {
  const parts = keyword.split(" ");
  if (parts.length === 1) {
    return tokens.some(
      (token) => token === keyword || (keyword.length >= 5 && token.startsWith(keyword)),
    );
  }
  for (let start = 0; start + parts.length <= tokens.length; start++) {
    if (parts.every((part, offset) => tokens[start + offset] === part)) return true;
  }
  return false;
}

// The category name a description points to, or null when no rule matches.
export function suggestCategoryName(description: string): string | null {
  const tokens = words(description);
  if (tokens.length === 0) return null;
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => matches(tokens, keyword))) return rule.category;
  }
  return null;
}

// Resolves a suggestion to one of the user's categories. A category the user
// renamed or deleted falls back to "Other"; if that is missing too, null lets
// the user choose in the preview.
export function suggestCategoryId(
  description: string,
  categories: readonly { id: string; name: string }[],
): string | null {
  const byName = (name: string) =>
    categories.find((category) => category.name.toLowerCase() === name.toLowerCase());
  const suggested = suggestCategoryName(description);
  return (suggested ? byName(suggested) : undefined)?.id ?? byName("Other")?.id ?? null;
}
