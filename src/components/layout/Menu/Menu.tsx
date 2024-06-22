"use client";

import { HandCoins, PieChart, SquareStack } from "lucide-react";
import { SideMenu } from "./SideMenu";
import { useTheme } from "next-themes";
import { MobileMenu } from "./MobileMenu";

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
];

export type MenuItem = (typeof menu)[0];

export const Menu = () => {
  const { theme, resolvedTheme } = useTheme();

  // Use resolvedTheme instead of theme for more accurate theme detection
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <>
      <SideMenu menu={menu} currentTheme={currentTheme} />
      <MobileMenu currentTheme={currentTheme} menu={menu} />
    </>
  );
};
