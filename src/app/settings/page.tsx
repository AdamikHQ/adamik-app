"use client"; // Add 'use client' directive for client-side hooks

import { useState, useEffect } from "react";
import { Switch } from "~/components/ui/switch"; // Adjust path assuming components are in src/components
import { Label } from "~/components/ui/label"; // Adjust path
import { Card, CardContent } from "~/components/ui/card";
import { Monitor, Wallet, Settings as SettingsIcon } from "lucide-react";

// Helper functions to get/set from localStorage (consider moving to a utils file)
const getLocalStorageItem = (key: string, defaultValue: boolean): boolean => {
  if (typeof window === "undefined") return defaultValue;
  const storedValue = localStorage.getItem(key);
  return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
};

const setLocalStorageItem = (key: string, value: boolean) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export default function SettingsPage() {
  const [showTestnets, setShowTestnets] = useState<boolean>(() =>
    getLocalStorageItem("showTestnets", false)
  );
  const [showLowBalances, setShowLowBalances] = useState<boolean>(() =>
    getLocalStorageItem("showLowBalances", true)
  );

  useEffect(() => {
    // Set initial value from localStorage
    setShowTestnets(getLocalStorageItem("showTestnets", false));
    setShowLowBalances(getLocalStorageItem("showLowBalances", true));

    // Add listener for storage events to sync across tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "showTestnets" && event.newValue !== null) {
        setShowTestnets(JSON.parse(event.newValue));
      }
      if (event.key === "showLowBalances" && event.newValue !== null) {
        setShowLowBalances(JSON.parse(event.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Persist initial or default values if not already set
    if (localStorage.getItem("showTestnets") === null) {
      setLocalStorageItem("showTestnets", false);
    }
    if (localStorage.getItem("showLowBalances") === null) {
      setLocalStorageItem("showLowBalances", true);
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Update localStorage when state changes
  useEffect(() => {
    setLocalStorageItem("showTestnets", showTestnets);
  }, [showTestnets]);

  useEffect(() => {
    setLocalStorageItem("showLowBalances", showLowBalances);
  }, [showLowBalances]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 pb-2 border-b">
        <SettingsIcon className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="grid gap-6">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6">
            <h2 className="text-xl font-semibold">Display Preferences</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Customize how you view your assets and chains
            </p>
          </div>
          <CardContent className="p-6 pt-6">
            <div className="grid gap-6">
              <div className="flex items-center justify-between space-x-4 rounded-lg border p-4 shadow-sm transition-all hover:bg-accent/50">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Monitor className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label
                      htmlFor="show-testnets"
                      className="text-base font-medium"
                    >
                      Show Testnet Chains
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Display chains intended for testing purposes.
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-testnets"
                  checked={showTestnets}
                  onCheckedChange={setShowTestnets}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="flex items-center justify-between space-x-4 rounded-lg border p-4 shadow-sm transition-all hover:bg-accent/50">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label
                      htmlFor="show-low-balances"
                      className="text-base font-medium"
                    >
                      Show Low Balances
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Display assets or chains with a value less than $1 in the
                      portfolio.
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-low-balances"
                  checked={showLowBalances}
                  onCheckedChange={setShowLowBalances}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
