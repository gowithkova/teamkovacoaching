"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DataStoreProvider } from "@/lib/store";
import { Sidebar } from "@/components/shell/Sidebar";
import { MobileNav } from "@/components/shell/MobileNav";
import { TopSummaryBar } from "@/components/shell/TopSummaryBar";
import { NAV_ITEMS } from "@/lib/nav";

function PageHeader() {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:px-6 lg:py-4">
      <h1 className="text-lg font-semibold text-ink">{current?.label ?? "KOVA Support OS"}</h1>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <DataStoreProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <PageHeader />
          <TopSummaryBar />
          <main className="flex-1 px-4 py-5 pb-28 lg:px-6 lg:py-6 lg:pb-6">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
      <MobileNav />
    </DataStoreProvider>
  );
}
