import {
  LayoutDashboard,
  Users,
  UserRound,
  CalendarDays,
  ClipboardCheck,
  Wallet,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  mobilePrimary: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "today", label: "Today", href: "/today", icon: LayoutDashboard, mobilePrimary: true },
  { key: "leads", label: "Leads", href: "/leads", icon: Users, mobilePrimary: true },
  { key: "clients", label: "Clients", href: "/clients", icon: UserRound, mobilePrimary: false },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDays, mobilePrimary: true },
  { key: "sessions", label: "Sessions", href: "/sessions", icon: ClipboardCheck, mobilePrimary: false },
  { key: "money", label: "Money", href: "/money", icon: Wallet, mobilePrimary: true },
  { key: "documents", label: "Documents & Safety", href: "/documents", icon: ShieldCheck, mobilePrimary: false },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings, mobilePrimary: false },
];

export const MOBILE_MORE_ITEMS = NAV_ITEMS.filter((item) => !item.mobilePrimary);
export const MOBILE_PRIMARY_ITEMS = NAV_ITEMS.filter((item) => item.mobilePrimary);
