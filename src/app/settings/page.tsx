"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Tooltip } from "~/components/ui/tooltip";

export default function Settings() {
  const [hideLowBalance, setHideLowBalance] = useState(true);

  const handleCheckboxChange = () => {
    setHideLowBalance(!hideLowBalance);
    localStorage.setItem("hideLowBalance", JSON.stringify(!hideLowBalance));
  };

  // Initialize state from localStorage
  useEffect(() => {
    const storedValue = localStorage.getItem("hideLowBalance");
    if (storedValue !== null) {
      setHideLowBalance(JSON.parse(storedValue));
    }
  }, []);

  return (
    <main className="flex-1 mx-auto w-full flex flex-col auto-rows-max gap-4 p-4 md:p-8 max-h-[100vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <CardTitle>Settings</CardTitle>
          <Tooltip text="Change or update your settings here">
            <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
          </Tooltip>
        </div>
      </div>
      <div className="flex flex-col">
        <Card className="xl:col-span-2 bg-muted/70">
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Placeholder for general settings */}
              <div className="flex flex-row gap-4 items-center bg-primary/10 p-4 rounded-md">
                <div className="flex flex-col">
                  <h1 className="text-lg font-bold md:text-2xl">
                    General Settings
                  </h1>
                  <p className="text-sm">Manage your general settings here.</p>
                </div>
              </div>
              {/* Checkbox for hiding low balance chains */}
              <div className="flex flex-row gap-4 items-center bg-primary/10 p-4 rounded-md">
                <Checkbox
                  id="hideBalanceAssetsBreakdown"
                  checked={hideLowBalance}
                  onCheckedChange={handleCheckboxChange}
                />
                <div className="flex flex-col">
                  <label
                    htmlFor="hideBalanceAssetsBreakdown"
                    className="text-sm font-medium leading-none"
                  >
                    {"Hide chains with low balances (< 1$)"}
                  </label>
                </div>
              </div>
            </div>
            <div className="flex flex-row justify-center mt-4">
              <Button asChild>
                <Link href="https://adamik.io/contact">
                  {"Need help? Contact support!"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
