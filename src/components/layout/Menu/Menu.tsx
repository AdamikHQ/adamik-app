"use client";

import { HandCoins, PieChart, SquareStack, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useWallet } from "~/hooks/useWallet";
import { MobileMenu } from "./MobileMenu";
import { SideMenu } from "./SideMenu";
import { WelcomeModal } from "../WelcomeModal";
import { useEffect, useState } from "react";

const menu = [
  {
    title: "Portfolio",
    icon: PieChart,
    href: "/",
  },
  {
    title: "Stake",
    icon: HandCoins,
    href: "/stake",
  },
  {
    title: "Supported chains",
    icon: SquareStack,
    href: "/supported-chains",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export type MenuItem = (typeof menu)[0];

export const Menu = () => {
  const { theme, resolvedTheme } = useTheme();
  const [isFirstTime, setFirstTime] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("AdamikClientState")) {
      setFirstTime(false);
    }
  }, []);

  // Use resolvedTheme instead of theme for more accurate theme detection
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <>
      <SideMenu menu={menu} currentTheme={currentTheme} />
      <MobileMenu currentTheme={currentTheme} menu={menu} />
      {isFirstTime && <WelcomeModal />}
    </>
  );
};
