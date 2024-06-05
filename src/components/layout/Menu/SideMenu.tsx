"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { MenuItem } from "./Menu";

type SideMenuProps = {
  menu: MenuItem[];
  currentTheme: string | undefined;
};

export const SideMenu: React.FC<SideMenuProps> = ({ menu, currentTheme }) => {
  const [mounted, setMounted] = useState(false);
  const path = usePathname();

  // Wait until the component is mounted to ensure the theme state is available
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use resolvedTheme instead of theme for more accurate theme detection

  return (
    <aside className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            {mounted && (
              <Image
                src={
                  currentTheme === "light"
                    ? "/adamik-logo-light.png"
                    : "/adamik-logo-dark.png"
                }
                width={152}
                height={32}
                alt="Adamik Logo"
              />
            )}
            <span className="font-bold">App</span>
          </Link>
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
        <div className="mt-auto p-4">
          <Card x-chunk="dashboard-02-chunk-0">
            <CardHeader className="p-2 pt-0 md:p-4 w-max-[130px]">
              <CardTitle>Get an API Key</CardTitle>
              <CardDescription>
                Get started with Adamik API for free
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
              <Button size="sm" className="w-full">
                Connect
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </aside>
  );
};
