"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdamikLink } from "./AdamikLink";
import { MenuItem } from "./Menu";
import { ThemeSelector } from "../ThemeSelector";
import AdamikLogo from "~/components/logo/AdamikLogo";

type SideMenuProps = {
  menu: MenuItem[];
  currentTheme: string | undefined;
};

export const SideMenu: React.FC<SideMenuProps> = ({ menu, currentTheme }) => {
  const path = usePathname();

  return (
    <aside className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <AdamikLogo
              width="152"
              height="32"
              color={currentTheme === "light" ? "#000" : "#fff"}
            />
            <span className="font-bold"></span>
          </Link>
          <ThemeSelector />
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {menu.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                  path === link.href
                    ? "text-primary bg-muted"
                    : "text-muted-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.title}
              </Link>
            ))}
          </nav>
        </div>
        <AdamikLink />
      </div>
    </aside>
  );
};
