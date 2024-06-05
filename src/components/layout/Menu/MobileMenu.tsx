import { PanelLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { AdamikLink } from "./AdamikLink";
import { MenuItem } from "./Menu";

type MobileMenuProps = {
  menu: MenuItem[];
  currentTheme: string | undefined;
};

export const MobileMenu: React.FC<MobileMenuProps> = ({
  menu,
  currentTheme,
}) => {
  const [mounted, setMounted] = useState(false);
  const path = usePathname();

  // Wait until the component is mounted to ensure the theme state is available
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="md:hidden sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="md:hidden absolute left-2 top-2"
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <div className="flex h-full max-h-screen justify-between flex-col">
            <nav className="grid gap-6 text-lg font-medium">
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
            <AdamikLink />
          </div>
        </SheetContent>
      </Sheet>
      <div className="container flex h-14 max-w-screen-2xl items-center justify-center">
        <div className="flex items-center space-x-4">
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
        </div>
      </div>
    </header>
  );
};
