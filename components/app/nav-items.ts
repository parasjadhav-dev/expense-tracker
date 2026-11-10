import {
  LayoutDashboard,
  List,
  Plus,
  Repeat,
  UserCog,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: List },
  { href: "/expenses/new", label: "Add expense", icon: Plus },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/settings", label: "Account", icon: UserCog },
];
