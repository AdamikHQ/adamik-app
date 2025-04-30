"use client"; // Add 'use client' directive for client-side hooks

import { useState, useEffect } from "react";
import { Switch } from "~/components/ui/switch"; // Adjust path assuming components are in src/components
import { Label } from "~/components/ui/label"; // Adjust path
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Info, Monitor, Wallet, Loader2 } from "lucide-react";
import { Tooltip } from "~/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useChains } from "~/hooks/useChains";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { Checkbox } from "~/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { resolveLogo, isStakingSupported } from "~/utils/helper";
import { SupportedBlockchain } from "~/utils/types";
import { getLocalStorageItem, setLocalStorageItem } from "~/utils/localStorage";

// List of chain IDs that are coming soon
const comingSoonIds = ["solana", "aptos"];

export default function SettingsPage() {
  const [showTestnets, setShowTestnets] = useState<boolean>(() =>
    getLocalStorageItem("showTestnets", false)
  );
  const [showLowBalances, setShowLowBalances] = useState<boolean>(() =>
    getLocalStorageItem("showLowBalances", true)
  );
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("preferences");

  // Fetch chains data
  const { isLoading: supportedChainsLoading, data: supportedChains } =
    useChains();
  const { isLoading: mobulaBlockchainLoading, data: mobulaBlockchains } =
    useMobulaBlockchains();

  const tickers = supportedChains
    ? Object.values(supportedChains).reduce<string[]>(
        (acc, chain) => [...acc, chain.ticker],
        []
      )
    : [];

  const { data: mobulaMarketData, isLoading: isAssetDetailsLoading } =
    useMobulaMarketMultiData(
      tickers,
      !mobulaBlockchainLoading && !supportedChainsLoading,
      "symbols"
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

  const handleFeatureSelect = (feature: string) => {
    setSelectedFeatures((prevSelected) =>
      prevSelected.includes(feature)
        ? prevSelected.filter((f) => f !== feature)
        : [...prevSelected, feature]
    );
  };

  // Function to determine label class for tooltips
  const getLabelClass = (label: string) => {
    switch (label) {
      case "token":
        return "tooltip-token";
      case "staking":
        return "tooltip-staking";
      case "history":
        return "tooltip-history";
      default:
        return "";
    }
  };

  // Process chains data for display
  const chainsWithInfo = supportedChains
    ? Object.values(supportedChains)
        .reduce<SupportedBlockchain[]>((acc, chain) => {
          // Skip testnet chains if not showing testnets
          if (!showTestnets && !!chain.isTestnetFor) {
            return acc;
          }

          // Determine labels based on chain features
          const labels: string[] = [];
          if (
            chain.supportedFeatures.read.account.balances.tokens &&
            chain.supportedFeatures.read.transaction.tokens
          ) {
            labels.push("token");
          }
          if (isStakingSupported(chain)) {
            labels.push("staking");
          }
          if (chain.supportedFeatures.read.account.transactions.native) {
            labels.push("history");
          }

          const supportedChain = {
            ...chain,
            labels,
            logo: resolveLogo({
              asset: { name: chain.name, ticker: chain.ticker },
              mobulaMarketData,
              mobulaBlockChainData: mobulaBlockchains,
            }),
          };
          return [...acc, supportedChain];
        }, [])
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  // Filter chains based on selected features
  const filteredChains = selectedFeatures.length
    ? chainsWithInfo.filter((chain) =>
        selectedFeatures.every((feature) => chain.labels!.includes(feature))
      )
    : chainsWithInfo;

  const isLoading =
    supportedChainsLoading || isAssetDetailsLoading || mobulaBlockchainLoading;

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="supported-chains">Supported Chains</TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
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
                        Display assets or chains with a value less than $1 in
                        the portfolio.
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
        </TabsContent>

        {/* Supported Chains Tab */}
        <TabsContent value="supported-chains">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Supported Chains</CardTitle>
                <Tooltip text="View the API documentation for fetching the supported chains list">
                  <a
                    href="https://docs.adamik.io/api-reference/endpoint/get-apichains"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Info className="w-4 h-4 text-gray-500 cursor-pointer" />
                  </a>
                </Tooltip>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium leading-none mr-2">
                    Filter by Features:
                  </label>
                  <div className="flex gap-2">
                    <Checkbox
                      id="filter-token"
                      checked={selectedFeatures.includes("token")}
                      onCheckedChange={() => handleFeatureSelect("token")}
                    />
                    <label
                      htmlFor="filter-token"
                      className="text-sm font-medium leading-none mr-2"
                    >
                      Token
                    </label>
                    <Checkbox
                      id="filter-staking"
                      checked={selectedFeatures.includes("staking")}
                      onCheckedChange={() => handleFeatureSelect("staking")}
                    />
                    <label
                      htmlFor="filter-staking"
                      className="text-sm font-medium leading-none mr-2"
                    >
                      Staking
                    </label>
                    <Checkbox
                      id="filter-history"
                      checked={selectedFeatures.includes("history")}
                      onCheckedChange={() => handleFeatureSelect("history")}
                    />
                    <label
                      htmlFor="filter-history"
                      className="text-sm font-medium leading-none"
                    >
                      Transaction History
                    </label>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                    {filteredChains.map((chain) => {
                      const isComingSoon = comingSoonIds.includes(chain.id);

                      return (
                        <div
                          key={chain.id}
                          className="relative flex flex-row gap-4 items-center bg-primary/10 p-4 rounded-md"
                        >
                          <div className="absolute top-2 right-2 tooltip-container flex space-x-1">
                            {chain.labels?.map((label: string) => (
                              <Tooltip key={label} text={label}>
                                <span
                                  className={`tooltip ${getLabelClass(
                                    label
                                  )} inline-block`}
                                >
                                  &nbsp;
                                </span>
                              </Tooltip>
                            ))}
                          </div>
                          <Avatar>
                            <AvatarImage src={chain.logo} alt={chain.name} />
                            <AvatarFallback>{chain.ticker}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <h1 className="text-lg font-bold">{chain.name}</h1>
                            <div className="flex flex-row gap-2 uppercase">
                              <h2 className="text-md font-semibold">
                                {chain.ticker}
                              </h2>
                              {isComingSoon && (
                                <Tooltip text="Coming Soon">
                                  <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                    Coming Soon
                                  </span>
                                </Tooltip>
                              )}
                              {chain.isTestnetFor && (
                                <span className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                  Testnet
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-row justify-center mt-6">
                    <Button asChild>
                      <Link href="https://adamik.io/contact">
                        {"Can't find your project? Reach out to us!"}
                      </Link>
                    </Button>
                  </div>

                  <div className="flex flex-row items-center mt-6">
                    <Checkbox
                      id="show-testnets-chains"
                      checked={showTestnets}
                      onCheckedChange={() => setShowTestnets(!showTestnets)}
                      className="mr-2"
                    />
                    <label
                      htmlFor="show-testnets-chains"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Show testnets
                    </label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
