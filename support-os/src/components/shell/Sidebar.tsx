"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-5 py-5">
        <p className="text-sm font-semibold tracking-wide text-ink">KOVA SUPPORT OS</p>
        <p className="mt-0.5 text-xs text-ink-soft">Find &rarr; Deliver &rarr; Get paid</p>
      </div>
      <nav aria-label="Primary" className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-soft text-accent-strong"
                  : "text-ink-soft hover:bg-surface-sunken hover:text-ink",
              )}
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line px-5 py-4 text-xs text-ink-faint">
        Synthetic demo data only
      </div>
    </aside>
  );
}
