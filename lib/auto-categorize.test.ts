import { describe, expect, it } from "vitest";
import {
  CATEGORY_RULES,
  suggestCategoryId,
  suggestCategoryName,
} from "@/lib/auto-categorize";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";

describe("suggestCategoryName: known merchants", () => {
  it.each([
    // Food
    ["Swiggy", "Food"],
    ["ZOMATO ORDER 18283", "Food"],
    ["Dominos Pizza", "Food"],
    ["Starbucks Coffee", "Food"],
    ["BigBasket", "Food"],
    ["Blinkit", "Food"],
    ["DMART SUPERMARKET", "Food"],
    ["Sharma Bakery", "Food"],
    // Travel
    ["Uber", "Travel"],
    ["OLA CABS", "Travel"],
    ["Rapido ride", "Travel"],
    ["IRCTC TICKET BOOKING", "Travel"],
    ["redBus", "Travel"],
    ["MakeMyTrip", "Travel"],
    ["IndiGo Airlines", "Travel"],
    ["HPCL petrol pump", "Travel"],
    ["FASTag recharge toll", "Travel"],
    ["Delhi Metro", "Travel"],
    // Rent
    ["House rent November", "Rent"],
    ["NEFT-HOUSE RENT-LANDLORD", "Rent"],
    ["NoBroker", "Rent"],
    // Shopping
    ["Amazon Pay India", "Shopping"],
    ["Flipkart", "Shopping"],
    ["Myntra", "Shopping"],
    ["Nykaa", "Shopping"],
    ["Decathlon", "Shopping"],
    ["Croma", "Shopping"],
    // Subscriptions
    ["NETFLIX.COM", "Subscriptions"],
    ["Spotify India", "Subscriptions"],
    ["Hotstar", "Subscriptions"],
    ["YouTube Premium", "Subscriptions"],
    ["Google Play", "Subscriptions"],
    ["iCloud storage", "Subscriptions"],
    // Bills
    ["BESCOM ELECTRICITY BILL", "Bills"],
    ["Airtel postpaid", "Bills"],
    ["Jio recharge", "Bills"],
    ["Tata Power", "Bills"],
    ["ACT Fibernet broadband", "Bills"],
    ["LIC premium", "Bills"],
    // Health
    ["Apollo Pharmacy", "Health"],
    ["PharmEasy", "Health"],
    ["Practo consultation", "Health"],
    ["City Hospital", "Health"],
    ["Dental clinic", "Health"],
    // Entertainment
    ["BookMyShow", "Entertainment"],
    ["PVR Cinemas", "Entertainment"],
    ["Dream11", "Entertainment"],
  ])("%s is %s", (description, expected) => {
    expect(suggestCategoryName(description)).toBe(expected);
  });
});

describe("suggestCategoryName: real bank and UPI descriptions", () => {
  it.each([
    ["UPI/412345/SWIGGY@ybl/Order", "Food"],
    ["UPI-ZOMATO-9876543210@okhdfcbank-HDFC-Lunch", "Food"],
    ["UPI/274833/UBER INDIA/Ride", "Travel"],
    ["POS 4291XXXXXX1234 AMAZON PAY", "Shopping"],
    ["ACH D- NETFLIX-12345", "Subscriptions"],
    ["IMPS/P2A/123456/BESCOM", "Bills"],
  ])("%s is %s", (description, expected) => {
    expect(suggestCategoryName(description)).toBe(expected);
  });

  it("finds a merchant glued to other letters when the keyword is long enough", () => {
    expect(suggestCategoryName("UPI-SWIGGYINSTAMART-123")).toBe("Food");
    expect(suggestCategoryName("ZOMATOLIMITED")).toBe("Food");
  });

  it("ignores case, punctuation and extra spaces", () => {
    expect(suggestCategoryName("sWiGgY")).toBe("Food");
    expect(suggestCategoryName("  s w i g g y  ")).toBeNull(); // letters apart are not a word
    expect(suggestCategoryName("---SWIGGY***")).toBe("Food");
    expect(suggestCategoryName("amazon   prime    membership")).toBe("Subscriptions");
  });
});

describe("suggestCategoryName: rule priority", () => {
  it("'amazon prime' is a subscription, plain 'amazon' is shopping", () => {
    expect(suggestCategoryName("AMAZON PRIME MEMBERSHIP")).toBe("Subscriptions");
    expect(suggestCategoryName("Prime Video")).toBe("Subscriptions");
    expect(suggestCategoryName("AMAZON PAY INDIA")).toBe("Shopping");
  });

  it("a description matching two categories takes the earlier rule", () => {
    // "swiggy" (Food) and "uber" (Travel) both appear: Food is listed first.
    expect(suggestCategoryName("Swiggy and Uber")).toBe("Food");
  });
});

describe("suggestCategoryName: short keywords must be whole words", () => {
  it.each([
    ["Coca Cola drinks", "'ola' inside 'cola'"],
    ["Busy bee stationers", "'bus' at the start of 'busy'"],
    ["Robust payment", "'bus' inside 'robust'"],
    ["Teacher fees", "'tea' at the start of 'teacher'"],
    ["Olaf toys", "'ola' at the start of 'olaf'"],
    ["Gasket repair", "'gas' at the start of 'gasket'"],
  ])("%s is not matched (%s)", (description) => {
    expect(suggestCategoryName(description)).toBeNull();
  });

  it("but the same short keywords match as whole words", () => {
    expect(suggestCategoryName("Chai and tea")).toBe("Food");
    expect(suggestCategoryName("Ola ride")).toBe("Travel");
    expect(suggestCategoryName("Bus pass")).toBe("Travel");
  });
});

describe("suggestCategoryName: unknown merchants", () => {
  it.each([
    "Transfer to Ramesh",
    "UPI/RAMESH KUMAR/Transfer",
    "ATM CASH WITHDRAWAL",
    "NEFT-ACCOUNT TRANSFER",
    "Cheque 000123",
    "Random shop",
    "Mr Patel",
    "रमेश कुमार",
    "12345 67890",
    "!!!",
    "",
    "   ",
  ])("%j has no suggestion", (description) => {
    expect(suggestCategoryName(description)).toBeNull();
  });

  it("does not throw on very long or odd input", () => {
    expect(() => suggestCategoryName("x".repeat(100000))).not.toThrow();
    expect(() => suggestCategoryName("\u0000‮😀")).not.toThrow();
    expect(suggestCategoryName("swiggy ".repeat(10000))).toBe("Food");
  });
});

describe("suggestCategoryId: using the user's own categories", () => {
  const mine = [
    { id: "id-food", name: "Food" },
    { id: "id-travel", name: "travel" }, // different capitalisation
    { id: "id-other", name: "Other" },
  ];

  it("returns the id of the matching category", () => {
    expect(suggestCategoryId("Swiggy", mine)).toBe("id-food");
  });

  it("matches category names without caring about capitalisation", () => {
    expect(suggestCategoryId("Uber", mine)).toBe("id-travel");
  });

  it("falls back to 'Other' when the user has no such category", () => {
    expect(suggestCategoryId("Netflix", mine)).toBe("id-other"); // no Subscriptions category
  });

  it("falls back to 'Other' when nothing matches", () => {
    expect(suggestCategoryId("Transfer to Ramesh", mine)).toBe("id-other");
    expect(suggestCategoryId("", mine)).toBe("id-other");
  });

  it("returns null when there is nothing to fall back to", () => {
    const noOther = [{ id: "id-food", name: "Food" }];
    expect(suggestCategoryId("Netflix", noOther)).toBeNull();
    expect(suggestCategoryId("random text", noOther)).toBeNull();
    expect(suggestCategoryId("Swiggy", noOther)).toBe("id-food");
    expect(suggestCategoryId("Swiggy", [])).toBeNull();
  });
});

describe("the rule table itself", () => {
  const names = CATEGORY_RULES.map((rule) => rule.category);
  const keywords = CATEGORY_RULES.flatMap((rule) =>
    rule.keywords.map((keyword) => ({ keyword, category: rule.category })),
  );

  it("only suggests categories every new account has", () => {
    for (const name of names) expect(DEFAULT_CATEGORIES).toContain(name);
  });

  it("lists each category once", () => {
    expect(new Set(names).size).toBe(names.length);
  });

  it("keeps keywords lowercase, trimmed and single-spaced, so they can match", () => {
    for (const { keyword } of keywords) {
      expect(keyword, keyword).toBe(keyword.toLowerCase().trim().replace(/\s+/g, " "));
      expect(keyword, keyword).toMatch(/^[a-z0-9]+( [a-z0-9]+)*$/);
    }
  });

  it("never uses the same keyword under two categories (the answer must not depend on order)", () => {
    const seen = new Map<string, string>();
    for (const { keyword, category } of keywords) {
      expect(seen.has(keyword), `"${keyword}" is in both ${seen.get(keyword)} and ${category}`).toBe(false);
      seen.set(keyword, category);
    }
  });

  it("every keyword finds its own category", () => {
    for (const { keyword, category } of keywords) {
      const found = suggestCategoryName(keyword);
      // A keyword may be claimed by an earlier, more specific rule; it must never
      // come back empty.
      expect(found, keyword).not.toBeNull();
      if (found !== category) {
        const earlier = names.indexOf(found!) < names.indexOf(category);
        expect(earlier, `"${keyword}" (${category}) was claimed by ${found}`).toBe(true);
      }
    }
  });
});
