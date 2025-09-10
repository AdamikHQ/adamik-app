"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "~/components/ui/use-toast";
import { useFilteredChains } from "~/hooks/useChains";
import { SupportedBlockchain } from "~/utils/types";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Input } from "~/components/ui/input";
import { Search, Check, Info } from "lucide-react";
import { walletChains } from "~/config/wallet-chains";
// Try to import the tabs components
// Commented out due to TS error, using inline destructuring with require instead
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tooltip } from "~/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Checkbox } from "~/components/ui/checkbox";
import Link from "next/link";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { resolveLogo, isStakingSupported } from "~/utils/helper";

// Try importing using require
const {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} = require("~/components/ui/tabs");

// Import tab components
import { SignerConfigurationContent } from "./tabs/SignerConfiguration";

export default function SettingsPage() {
  const { toast } = useToast();
  const {
    data: chains,
    isLoading: chainsLoading,
    showTestnets: initialShowTestnets,
  } = useFilteredChains();
  const [showTestnets, setShowTestnets] = useState(false);
  const [hideLowBalances, setHideLowBalances] = useState(false);
  const [showAssetsWithoutIcons, setShowAssetsWithoutIcons] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    // Initialize showTestnets from the hook
    if (typeof initialShowTestnets === "boolean") {
      setShowTestnets(initialShowTestnets);
    }

    // Initialize hideLowBalances from localStorage
    try {
      const clientState = localStorage.getItem("AdamikClientState") || "{}";
      const parsedState = JSON.parse(clientState);
      if (typeof parsedState.hideLowBalances === "boolean") {
        setHideLowBalances(parsedState.hideLowBalances);
      }
      if (typeof parsedState.showAssetsWithoutIcons === "boolean") {
        setShowAssetsWithoutIcons(parsedState.showAssetsWithoutIcons);
      }
    } catch (error) {
      console.error("Error reading settings:", error);
    }
  }, [initialShowTestnets]);

  const handleShowTestnetsToggle = (checked: boolean) => {
    setShowTestnets(checked);
    setIsModified(true);
  };

  const handleHideLowBalancesToggle = (checked: boolean) => {
    setHideLowBalances(checked);
    setIsModified(true);
  };

  const handleShowAssetsWithoutIconsToggle = (checked: boolean) => {
    setShowAssetsWithoutIcons(checked);
    setIsModified(true);
  };

  const saveSettings = () => {
    try {
      // Update settings in localStorage
      const clientState = localStorage.getItem("AdamikClientState") || "{}";
      const parsedState = JSON.parse(clientState);

      // Save the settings
      localStorage.setItem(
        "AdamikClientState",
        JSON.stringify({
          ...parsedState,
          showTestnets: showTestnets,
          hideLowBalances: hideLowBalances,
          showAssetsWithoutIcons: showAssetsWithoutIcons,
        })
      );

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("adamik-settings-changed"));

      toast({
        description: "Settings saved successfully.",
        duration: 3000,
      });

      setIsModified(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        description: "Failed to save settings",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Supported Chains content
  const SupportedChainsContent = () => {
    const [localShowTestnets, setLocalShowTestnets] = useState(false);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const { isLoading: mobulaBlockchainLoading, data: mobulaBlockchains } =
      useMobulaBlockchains();

    const tickers = Object.values(chains || {}).reduce<string[]>(
      (acc, chain) => [...acc, chain.ticker],
      []
    );

    const { data: mobulaMarketData, isLoading: isAssetDetailsLoading } =
      useMobulaMarketMultiData(
        tickers,
        !mobulaBlockchainLoading && !chainsLoading,
        "symbols"
      );

    const chainsWithInfo = React.useMemo(() => {
      return Object.values(chains || {})
        .reduce<SupportedBlockchain[]>((acc, chain) => {
          if (!(showTestnets || !chain.isTestnetFor)) {
            return acc;
          }

          const supportedChain: SupportedBlockchain = {
            ...chain,
            logo: resolveLogo({
              asset: { name: chain.name, ticker: chain.ticker },
              mobulaMarketData,
              mobulaBlockChainData: mobulaBlockchains,
            }),
            labels: [], // Initialize with empty array; labels would be populated elsewhere
          };
          return [...acc, supportedChain];
        }, [])
        .sort((a, b) => a.name.localeCompare(b.name));
    }, [mobulaMarketData, mobulaBlockchains]);

    const filteredSupportedChains = selectedFeatures.length
      ? chainsWithInfo.filter((chain) =>
          selectedFeatures.every((feature) => chain.labels?.includes(feature))
        )
      : chainsWithInfo;

    const additionalChains = Object.values(chains || {}).reduce<string[]>(
      (acc, chain) => {
        return !!chain.isTestnetFor && !acc.includes(chain.name)
          ? [...acc, chain.id]
          : acc;
      },
      []
    );

    const handleCheckboxChange = () => {
      setLocalShowTestnets(!localShowTestnets);
    };

    const handleFeatureSelect = (feature: string) => {
      setSelectedFeatures((prevSelected) =>
        prevSelected.includes(feature)
          ? prevSelected.filter((f) => f !== feature)
          : [...prevSelected, feature]
      );
    };

    const isLoading =
      chainsLoading || isAssetDetailsLoading || mobulaBlockchainLoading;

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

    const comingSoonIds = ["tron", "the-open-network", "solana"];

    return (
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold">Supported Chains</h2>
            <Tooltip text="View the API documentation for fetching the supported chains list">
              <a
                href="https://docs.adamik.io/api-reference/endpoint/get-apichains"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
              </a>
            </Tooltip>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium leading-none">
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
                  className="text-sm font-medium leading-none"
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
                  className="text-sm font-medium leading-none"
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
        </div>
        <div>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              {filteredSupportedChains?.map((chain) => {
                const isComingSoon = comingSoonIds.includes(chain.id);

                return (
                  <div
                    key={chain.id}
                    className="relative flex flex-row gap-4 items-center bg-primary/10 p-4 rounded-md"
                  >
                    <div className="absolute top-2 right-2 tooltip-container">
                      {chain.labels?.map((label: string) => (
                        <Tooltip key={label} text={label}>
                          <span className={`tooltip ${getLabelClass(label)}`}>
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
                      <h1 className="text-lg font-bold md:text-2xl">
                        {chain.name}
                      </h1>
                      <div className="flex flex-row gap-2 uppercase">
                        <h2 className="text-md font-semibold">
                          {chain.ticker}
                        </h2>
                        {isComingSoon && (
                          <Tooltip text="Coming Soon">
                            <span className="tooltip-content">Coming Soon</span>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex flex-row justify-center mt-4">
            <Button asChild>
              <Link href="https://adamik.io/contact">
                {"Can't find your project? Reach out to us!"}
              </Link>
            </Button>
          </div>
          <div className="flex flex-row items-center mt-4">
            <Checkbox
              id="show-supported-chains-testnets"
              checked={localShowTestnets}
              onCheckedChange={handleCheckboxChange}
              className="mr-2"
            />
            <label
              htmlFor="show-supported-chains-testnets"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show testnets
            </label>
          </div>
          {localShowTestnets && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-2">
                Additional Chains (Testnets)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {additionalChains.map((chain) => (
                  <div
                    key={chain}
                    className="flex flex-row gap-4 items-center bg-primary/10 p-2 rounded-md"
                  >
                    <div className="flex flex-col">
                      <h1 className="text-lg font-bold md:text-1xl">{chain}</h1>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold md:text-2xl">Settings</h1>
      </div>

      <Tabs
        defaultValue="general"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="chains">Supported Chains</TabsTrigger>
          <TabsTrigger value="signer">Signer Config</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <div className="grid gap-4 md:gap-8 grid-cols-1">
            <div className="p-6 bg-card rounded-lg border shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Chain Settings</h2>

              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Switch
                    id="hide-low-balances"
                    checked={hideLowBalances}
                    onCheckedChange={handleHideLowBalancesToggle}
                  />
                  <Label htmlFor="hide-low-balances">
                    Hide chains with low balances (&lt; 1$)
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  This setting controls whether chains with balances below $1
                  are hidden in the portfolio view.
                  <span className="block mt-1 text-yellow-500">
                    Note: Changes to this setting require a page refresh to
                    fully apply.
                  </span>
                </p>

                <div className="flex items-center space-x-2 mb-6">
                  <Switch
                    id="show-testnets"
                    checked={showTestnets}
                    onCheckedChange={handleShowTestnetsToggle}
                  />
                  <Label htmlFor="show-testnets">Show testnets</Label>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  This setting controls whether testnet chains are shown
                  throughout the application.
                  <span className="block mt-1 text-yellow-500">
                    Note: Changes to this setting require a page refresh to
                    fully apply.
                  </span>
                </p>

                <div className="flex items-center space-x-2 mb-6">
                  <Switch
                    id="show-assets-without-icons"
                    checked={showAssetsWithoutIcons}
                    onCheckedChange={handleShowAssetsWithoutIconsToggle}
                  />
                  <Label htmlFor="show-assets-without-icons">
                    Show assets without icons
                  </Label>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  This setting allows you to view assets even when no icon is
                  available from Mobula. Assets without icons will display the
                  first letter of their name as a fallback.
                  <span className="block mt-1 text-yellow-500">
                    Note: Changes to this setting require a page refresh to
                    fully apply.
                  </span>
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={saveSettings} disabled={!isModified}>
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chains" className="mt-0">
          <Card className="bg-card rounded-lg border shadow-sm">
            <CardContent className="pt-6">
              <SupportedChainsContent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signer" className="mt-0">
          <SignerConfigurationContent />
        </TabsContent>
      </Tabs>
    </main>
  );
}
