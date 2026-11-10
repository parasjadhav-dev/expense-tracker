// The email sent after sign-up. Pure (no network), so it is easy to test.

// The name is typed by the user, so it is escaped before it goes into HTML.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Keeps a name from adding lines or odd characters to the plain-text version.
function cleanName(name: string | undefined): string {
  return (name ?? "").replace(/[\r\n\t]+/g, " ").trim();
}

export function welcomeEmail({
  name,
  appUrl,
}: {
  name?: string;
  appUrl: string;
}): { subject: string; text: string; html: string } {
  const who = cleanName(name);
  const base = appUrl.replace(/\/+$/, "");
  const loginUrl = `${base}/login`;

  const tips = [
    "Add your first expense, or import a bank or UPI statement as a CSV file.",
    "Set a monthly budget and limits for each category to get overspend alerts.",
    "Add rent and subscriptions under Recurring so they are added every month.",
  ];

  const text = [
    who ? `Hi ${who},` : "Hi,",
    "",
    "Welcome to Expense Tracker. Your account is ready.",
    "",
    "A few ways to start:",
    ...tips.map((tip) => `- ${tip}`),
    "",
    `Log in: ${loginUrl}`,
    "",
    "If you did not create this account, you can ignore this email.",
  ].join("\n");

  const html = `<p>${who ? `Hi ${escapeHtml(who)},` : "Hi,"}</p>
<p>Welcome to Expense Tracker. Your account is ready.</p>
<p>A few ways to start:</p>
<ul>
${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("\n")}
</ul>
<p><a href="${loginUrl}">Log in to Expense Tracker</a></p>
<p>If you did not create this account, you can ignore this email.</p>`;

  return { subject: "Welcome to Expense Tracker", text, html };
}
