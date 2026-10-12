"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal, Plus, X } from "lucide-react";
import { MOBILE_MORE_ITEMS, MOBILE_PRIMARY_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { QuickAddMenu } from "@/components/shell/QuickAddMenu";

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-line bg-surface/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {MOBILE_PRIMARY_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-accent-strong" : "text-ink-soft",
              )}
            >
              <Icon size={20} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-ink-soft"
          aria-haspopup="dialog"
        >
          <MoreHorizontal size={20} aria-hidden="true" />
          More
        </button>
      </nav>

      <button
        onClick={() => setQuickAddOpen(true)}
        aria-label="Create new"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg hover:bg-accent-strong lg:hidden"
      >
        <Plus size={26} aria-hidden="true" />
      </button>

      {moreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="More sections"
          className="fixed inset-0 z-40 flex items-end bg-ink/40 lg:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-surface p-4 pb-8"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">More</h2>
              <button aria-label="Close" onClick={() => setMoreOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-lg text-ink-soft hover:bg-surface-sunken">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2 rounded-lg border border-line px-3 py-3 text-sm font-medium text-ink hover:border-accent hover:text-accent-strong"
                  >
                    <Icon size={18} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <QuickAddMenu open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  );
}
