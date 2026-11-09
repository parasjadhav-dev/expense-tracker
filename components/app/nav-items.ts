import { LayoutDashboard, List, Plus, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Add Budgets here when that page exists, so there are no dead links.
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: List },
  { href: "/expenses/new", label: "Add expense", icon: Plus },
];
