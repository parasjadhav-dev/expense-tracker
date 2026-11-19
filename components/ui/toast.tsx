"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

// Small confirmations ("Expense deleted", "Budget saved") that appear for a few
// seconds and go away on their own. Success and info messages are announced
// politely to screen readers; an error is announced at once (role="alert") and
// stays longer. Hovering or focusing a toast pauses its timer.
//
// <ToastProvider> sits in the app layout. Components call useToast(), or wrap a
// server action with useToastAction() so its result shows up as a toast. After a
// redirect (where the page that started the action is gone) the server leaves a
// one-line "flash" cookie instead; <FlashToast> shows it on the next page.

type Tone = "success" | "error" | "info";
type ToastItem = { id: number; tone: Tone; message: string; duration: number };

const DURATION: Record<Tone, number> = { success: 4000, info: 4000, error: 7000 };
const MAX_VISIBLE = 3;

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>.");
  return api;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((tone: Tone, message: string) => {
    const text = message.trim();
    if (!text) return;
    setToasts((current) => {
      // The same message twice in a row (a double tap) shows once.
      if (current.some((toast) => toast.message === text && toast.tone === tone)) {
        return current;
      }
      const item: ToastItem = {
        id: nextId.current++,
        tone,
        message: text,
        duration: DURATION[tone],
      };
      return [...current, item].slice(-MAX_VISIBLE);
    });
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("error", message),
      info: (message) => show("info", message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Above the phone's bottom tab bar; bottom-right from tablet width up. */}
      <div
        aria-live="polite"
        data-testid="toast-region"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
const ICON_COLOR = {
  success: "text-emerald-600 dark:text-emerald-400",
  error: "text-red-700 dark:text-red-400",
  info: "text-[#0f766e] dark:text-[#5eead4]",
} as const;

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [paused, setPaused] = useState(false);
  const Icon = ICONS[toast.tone];

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [paused, toast.id, toast.duration, onDismiss]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : undefined}
      data-testid="toast"
      data-tone={toast.tone}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-white py-3 pl-4 pr-2 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:ring-white/15"
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${ICON_COLOR[toast.tone]}`} aria-hidden="true" />
      <p className="min-w-0 flex-1 py-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="-my-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

type ActionState = { status: string; message?: string };

// Wraps a server action for useActionState so that its result also shows as a
// toast. The toast is raised from the wrapper, not from an effect in the form,
// so it still appears when the action removes the form that started it (a deleted
// row, a closed dialog).
//   success: the toast text. Without it the state's own `message` is used, and
//            without either there is no toast.
//   error:   also toast failures (off by default, because forms show their
//            errors next to the fields).
export function useToastAction<S extends ActionState>(
  action: (previous: S, formData: FormData) => Promise<S>,
  options: { success?: string; error?: boolean } = {},
) {
  const toast = useToast();
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  return useCallback(
    async (previous: S, formData: FormData): Promise<S> => {
      const next = await action(previous, formData);
      const { success, error } = optionsRef.current;
      if (next.status === "success") {
        const text = success ?? next.message;
        if (text) toast.success(text);
      } else if (next.status === "error" && error && next.message) {
        toast.error(next.message);
      }
      return next;
    },
    [action, toast],
  );
}

// For a plain `<form action={fn}>` whose action returns whether it worked: runs
// it, then shows the success message, or a failure message if it returned false.
export function useToastForm(
  action: (formData: FormData) => Promise<boolean>,
  message: string,
) {
  const toast = useToast();
  return useCallback(
    async (formData: FormData) => {
      const worked = await action(formData);
      if (worked) toast.success(message);
      else toast.error("That did not work. Please try again.");
    },
    [action, toast, message],
  );
}

// Shows the one-line message a server action left in the "flash" cookie before
// redirecting (see lib/flash.ts), then clears it. It looks again after every
// navigation, so the message appears on the page the user lands on.
export function FlashToast() {
  const toast = useToast();
  const pathname = usePathname();

  useEffect(() => {
    const match = /(?:^|; )flash=([^;]*)/.exec(document.cookie);
    if (!match) return;
    document.cookie = "flash=; Max-Age=0; Path=/; SameSite=Lax";
    try {
      toast.success(decodeURIComponent(match[1]));
    } catch {
      // A garbled cookie is not worth a message.
    }
  }, [pathname, toast]);

  return null;
}
