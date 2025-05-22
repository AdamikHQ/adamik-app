"use client";

import {
  HandCoins,
  History,
  PieChart,
  Search,
  Settings,
  Wallet,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { WelcomeModal } from "../WelcomeModal";
import { MobileMenu } from "./MobileMenu";
import { SideMenu } from "./SideMenu";

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
    title: "Transaction Details",
    icon: Search,
    href: "/data",
  },
  {
    title: "Transaction History",
    icon: History,
    href: "/history",
  },
  {
    title: "StarkNet Web Wallet",
    icon: Wallet,
    href: "/starknet-wallet",
  },
  {
    title: "StarkNet Ledger",
    icon: Wallet,
    href: "/starknet-ledger",
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
