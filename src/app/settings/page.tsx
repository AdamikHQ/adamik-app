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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tooltip } from "~/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Checkbox } from "~/components/ui/checkbox";
import Link from "next/link";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { resolveLogo, isStakingSupported } from "~/utils/helper";

// Import Sodot components and types
import { SodotTestContent } from "./tabs/SodotTest";

export default function SettingsPage() {
  const { toast } = useToast();
  const {
    data: chains,
    isLoading: chainsLoading,
    showTestnets: initialShowTestnets,
  } = useFilteredChains();
  const [showTestnets, setShowTestnets] = useState(true);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModified, setIsModified] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    // Load initial settings
    if (chains) {
      // Get defaultChains from localStorage if available
      const clientState = localStorage.getItem("AdamikClientState");
      let defaultChains = [...walletChains];

      if (clientState) {
        try {
          const parsedState = JSON.parse(clientState);
          if (
            parsedState.defaultChains &&
            Array.isArray(parsedState.defaultChains)
          ) {
            defaultChains = parsedState.defaultChains;
          }
        } catch (error) {
          console.error("Error parsing client state:", error);
        }
      }

      // Filter to only include chains that exist in the current chains data
      setSelectedChains(defaultChains.filter((chain) => chains[chain]));
    }

    // Initialize showTestnets from the hook
    if (typeof initialShowTestnets === "boolean") {
      setShowTestnets(initialShowTestnets);
    }
  }, [chains, initialShowTestnets]);

  // Filter chains based on search query
  const filteredChains = React.useMemo(() => {
    if (!chains) return [];

    return Object.entries(chains)
      .filter(([chainId, chain]) => {
        // Filter by search query
        const matchesSearch = chain.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        return matchesSearch;
      })
      .sort((a, b) => {
        // Sort by selection status first
        const aSelected = selectedChains.includes(a[0]);
        const bSelected = selectedChains.includes(b[0]);

        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;

        // Then sort by mainnet (non-testnets first)
        const aIsTestnet = !!a[1].isTestnetFor;
        const bIsTestnet = !!b[1].isTestnetFor;

        if (!aIsTestnet && bIsTestnet) return -1;
        if (aIsTestnet && !bIsTestnet) return 1;

        // Then alphabetically
        return a[1].name.localeCompare(b[1].name);
      });
  }, [chains, searchQuery, selectedChains]);

  const toggleChain = (chainId: string) => {
    setSelectedChains((prev) =>
      prev.includes(chainId)
        ? prev.filter((id) => id !== chainId)
        : [...prev, chainId]
    );
    setIsModified(true);
  };

  const handleShowTestnetsToggle = (checked: boolean) => {
    setShowTestnets(checked);
    setIsModified(true);
  };

  const saveSettings = () => {
    try {
      // Update settings in localStorage
      const clientState = localStorage.getItem("AdamikClientState") || "{}";
      const parsedState = JSON.parse(clientState);

      // Save the selected chains and showTestnets setting
      localStorage.setItem(
        "AdamikClientState",
        JSON.stringify({
          ...parsedState,
          defaultChains: selectedChains,
          showTestnets: showTestnets,
        })
      );

      toast({
        description:
          "Settings saved successfully. Changes will take effect after page refresh.",
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

  const ChainItem = ({
    chainId,
    chain,
    isSelected,
  }: {
    chainId: string;
    chain: SupportedBlockchain;
    isSelected: boolean;
  }) => (
    <div
      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-accent ${
        isSelected ? "bg-accent" : ""
      }`}
      onClick={() => toggleChain(chainId)}
    >
      <div className="flex items-center gap-3">
        {chain.logo && (
          <img
            src={chain.logo}
            alt={`${chain.name} logo`}
            className="w-6 h-6 rounded-full"
          />
        )}
        <div className="flex flex-col">
          <span>{chain.name}</span>
          {chain.isTestnetFor && (
            <span className="text-xs text-yellow-500">Testnet</span>
          )}
        </div>
      </div>
      {isSelected && <Check className="w-4 h-4 text-primary" />}
    </div>
  );

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
      if (!chains) return [];

      return Object.values(chains)
        .reduce<(SupportedBlockchain & { labels?: string[] })[]>(
          (acc, chain) => {
            if (!!chain.isTestnetFor) {
              return acc;
            }

            // Determine labels based on chain features
            const labels: string[] = [];
            if (
              chain.supportedFeatures?.read?.account?.balances?.tokens &&
              chain.supportedFeatures?.read?.transaction?.tokens
            ) {
              labels.push("token");
            }
            if (isStakingSupported(chain)) {
              labels.push("staking");
            }
            if (chain.supportedFeatures?.read?.account?.transactions?.native) {
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
          },
          []
        )
        .sort((a, b) => a.name.localeCompare(b.name));
    }, [chains, mobulaMarketData, mobulaBlockchains]);

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
          <TabsTrigger value="sodot">Sodot Test</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <div className="grid gap-4 md:gap-8 grid-cols-1">
            <div className="p-6 bg-card rounded-lg border shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Chain Settings</h2>

              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Switch
                    id="show-testnets"
                    checked={showTestnets}
                    onCheckedChange={handleShowTestnetsToggle}
                  />
                  <Label htmlFor="show-testnets">Show testnets</Label>
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  This setting controls whether testnet chains are shown
                  throughout the application.
                  <span className="block mt-1 text-yellow-500">
                    Note: Changes to this setting require a page refresh to
                    fully apply.
                  </span>
                </p>

                <p className="text-sm text-muted-foreground mt-6 mb-2">
                  Select the default chains that will be automatically connected
                  when a user connects their wallet for the first time:
                </p>

                <div className="mt-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search chains..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="mb-2 text-sm text-muted-foreground">
                    {selectedChains.length} chains selected
                  </div>

                  <ScrollArea className="h-[400px] rounded-md border p-4">
                    {filteredChains.map(([chainId, chain]) => (
                      <ChainItem
                        key={chainId}
                        chainId={chainId}
                        chain={chain}
                        isSelected={selectedChains.includes(chainId)}
                      />
                    ))}

                    {filteredChains.length === 0 && (
                      <div className="text-center p-4 text-muted-foreground">
                        {chainsLoading
                          ? "Loading chains..."
                          : "No chains found matching your criteria"}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setSelectedChains([]);
                    setIsModified(true);
                  }}
                  variant="outline"
                  disabled={selectedChains.length === 0}
                >
                  Clear All
                </Button>
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

        <TabsContent value="sodot" className="mt-0">
          <Card className="bg-card rounded-lg border shadow-sm">
            <CardContent className="pt-6">
              <SodotTestContent />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
