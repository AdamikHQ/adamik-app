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
import { Search, Check } from "lucide-react";
import { walletChains } from "~/config/wallet-chains";

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

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold md:text-2xl">Settings</h1>
      </div>

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
              This setting controls whether testnet chains are shown throughout
              the application.
              <span className="block mt-1 text-yellow-500">
                Note: Changes to this setting require a page refresh to fully
                apply.
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
    </main>
  );
}
