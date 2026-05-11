// components/AppShell.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import SlideDrawer from "@/components/SlideDrawer";
import { SearchProvider, useSearch } from "@/contexts/SearchContext";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password","/admin/login","/admin","/order-success"];

function AppShellInner({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const isCart = pathname.startsWith("/cart");
  const { setSearchQuery } = useSearch();

  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  return (
    <>
      <Header
        title={isCart ? "Cart" : "WELCOME"}
        showBack={isCart}
        onMenuClick={() => setDrawerOpen(true)}
        onSearch={(val) => setSearchQuery(val)}
        onClear={() => setSearchQuery("")}
      />
      <SlideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main>{children}</main>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <AppShellInner>{children}</AppShellInner>
    </SearchProvider>
  );
}