import { connection } from "next/server";
import { LogOut } from "lucide-react";
import { auth } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { button } from "@/lib/ui";

function initials(name: string): string {
  const parts = name.split(/[\s@._-]+/).filter(Boolean);
  const letters = (parts.length > 1 ? [parts[0], parts[1]] : [parts[0] ?? "?"])
    .map((part) => part[0])
    .join("");
  return letters.slice(0, 2).toUpperCase();
}

// Shows the signed-in user and a logout button. Reads the session at request
// time, so render it inside <Suspense>.
export async function UserMenu() {
  await connection();
  const session = await auth();
  if (!session?.user) return null;

  const display = session.user.name ?? session.user.email ?? "Signed in";

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <div className="flex items-center gap-3 px-1">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3987e5] to-[#1c5cab] text-xs font-semibold text-white"
        >
          {initials(display)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
            {session.user.name ?? "Signed in"}
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {session.user.email}
          </p>
        </div>
      </div>
      <form action={logout}>
        <button type="submit" className={`${button("secondary", "sm")} w-full`}>
          <LogOut className="size-3.5" aria-hidden="true" />
          Log out
        </button>
      </form>
    </div>
  );
}
