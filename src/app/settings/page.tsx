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
  const [hideSpamTokens, setHideSpamTokens] = useState(true);

  const handleHideLowBalanceChange = () => {
    const newValue = !hideLowBalance;
    setHideLowBalance(newValue);
    localStorage.setItem("hideLowBalance", JSON.stringify(newValue));
  };

  const handleHideSpamTokensChange = () => {
    const newValue = !hideSpamTokens;
    setHideSpamTokens(newValue);
    localStorage.setItem("hideSpamTokens", JSON.stringify(newValue));
  };

  // Initialize state from localStorage
  useEffect(() => {
    const storedHideLowBalance = localStorage.getItem("hideLowBalance");
    if (storedHideLowBalance !== null) {
      setHideLowBalance(JSON.parse(storedHideLowBalance));
    }

    const storedHideSpamTokens = localStorage.getItem("hideSpamTokens");
    if (storedHideSpamTokens !== null) {
      setHideSpamTokens(JSON.parse(storedHideSpamTokens));
    }
  }, []);

  return (
    <main className="flex-1 mx-auto w-full flex flex-col auto-rows-max gap-4 p-4 md:p-8 max-h-[100vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <CardTitle>General Settings</CardTitle>
          <Tooltip text="Manage your general settings here">
            <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
          </Tooltip>
        </div>
      </div>
      <div className="flex flex-col">
        <Card className="xl:col-span-2 bg-muted/70">
          <CardContent>
            <div className="grid grid-cols-1 gap-4 mt-4">
              {/* Checkbox for hiding spam tokens */}
              <div className="flex flex-row gap-4 items-center bg-primary/10 p-4 rounded-md w-full">
                <Checkbox
                  id="hideSpamTokens"
                  checked={hideSpamTokens}
                  onCheckedChange={handleHideSpamTokensChange}
                />
                <div className="flex flex-col">
                  <label
                    htmlFor="hideSpamTokens"
                    className="text-sm font-medium leading-none"
                  >
                    {"Hide Spam Tokens"}
                  </label>
                </div>
              </div>
              {/* Checkbox for hiding low balance chains */}
              <div className="flex flex-row gap-4 items-center bg-primary/10 p-4 rounded-md w-full">
                <Checkbox
                  id="hideBalanceAssetsBreakdown"
                  checked={hideLowBalance}
                  onCheckedChange={handleHideLowBalanceChange}
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
