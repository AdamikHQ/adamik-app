"use client"; // Add 'use client' directive for client-side hooks

import { useState, useEffect } from "react";
import { Switch } from "~/components/ui/switch"; // Adjust path assuming components are in src/components
import { Label } from "~/components/ui/label"; // Adjust path
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Info, Monitor, Wallet } from "lucide-react";
import { Tooltip } from "~/components/ui/tooltip";

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
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Settings</h1>
          <Tooltip text="Configure application preferences">
            <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
          </Tooltip>
        </div>
      </div>

      <div className="grid gap-4 md:gap-8 grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Display Preferences</CardTitle>
              <Tooltip text="Settings to control what content is displayed">
                <Info className="w-4 h-4 text-gray-500 cursor-pointer" />
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label htmlFor="show-testnets" className="text-base">
                      Show Testnet Chains
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Display chains intended for testing purposes.
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-testnets"
                  checked={showTestnets}
                  onCheckedChange={setShowTestnets}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label htmlFor="show-low-balances" className="text-base">
                      Show Low Balances
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Display assets or chains with a value less than $1 in the
                      portfolio.
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-low-balances"
                  checked={showLowBalances}
                  onCheckedChange={setShowLowBalances}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
