import { connection } from "next/server";
import { LogOut } from "lucide-react";
import { auth } from "@/lib/auth";
import { logout } from "@/app/login/actions";

// Shows the signed-in user and a logout button. Reads the session at request
// time, so render it inside <Suspense>.
export async function UserMenu() {
  await connection();
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <div className="min-w-0 px-3">
        <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {session.user.name ?? "Signed in"}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {session.user.email}
        </p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </button>
      </form>
    </div>
  );
}
