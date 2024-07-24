"use client";

import { Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MobulaMarketMultiDataResponse } from "~/api/mobula/marketMultiData";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Tooltip } from "~/components/ui/tooltip"; // Import TooltipProvider
import { useChains } from "~/hooks/useChains";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { resolveLogo } from "~/utils/helper";
import { SupportedBlockchain, Feature } from "~/utils/types";

const comingSoonIds = ["tron", "the-open-network", "solana"];

export default function SupportedChains() {
  const { isLoading: supportedChainsLoading, data: supportedChains } =
    useChains();
  const [showTestnets, setShowTestnets] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]); // Add state for selected features
  const { isLoading: mobulaBlockchainLoading, data: mobulaBlockchains } =
    useMobulaBlockchains();
  const tickers = Object.values(supportedChains || {}).reduce<string[]>(
    (acc, chain) => [...acc, chain.ticker],
    []
  );
  const {
    data: mobulaMarketData,
    isLoading: isAssetDetailsLoading,
  }: { data: MobulaMarketMultiDataResponse; isLoading: boolean } =
    useMobulaMarketMultiData(
      tickers,
      !mobulaBlockchainLoading && !supportedChainsLoading,
      "symbols"
    );

  if (!supportedChains) {
    return null;
  }

  const chainsWithInfo = Object.values(supportedChains)
    .reduce<SupportedBlockchain[]>((acc, chain) => {
      if (chain.isTestNet) {
        return acc;
      }

      // Determine labels based on chain features
      const labels: string[] = [];
      if (
        chain.supportedFeatures.includes(Feature.BALANCES_TOKENS) &&
        chain.supportedFeatures.includes(Feature.TRANSACTIONS_TOKENS)
      ) {
        labels.push("token");
      }
      if (chain.supportedFeatures.includes(Feature.BALANCES_STAKING)) {
        labels.push("staking");
      }

      const supportedChain = {
        ...chain,
        labels, // Add labels to the chain object
        logo: resolveLogo({
          asset: { name: chain.name, ticker: chain.ticker },
          mobulaMarketData,
          mobulaBlockChainData: mobulaBlockchains,
        }),
      };
      return [...acc, supportedChain];
    }, [])
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredChains = selectedFeatures.length
    ? chainsWithInfo.filter((chain) =>
        selectedFeatures.every((feature) => chain.labels!.includes(feature))
      )
    : chainsWithInfo;

  const additionalChains = Object.values(supportedChains).reduce<string[]>(
    (acc, chain) => {
      return chain.isTestNet && !acc.includes(chain.name)
        ? [...acc, chain.id]
        : acc;
    },
    []
  );

  const handleCheckboxChange = () => {
    setShowTestnets(!showTestnets);
  };

  const handleFeatureSelect = (feature: string) => {
    setSelectedFeatures((prevSelected) =>
      prevSelected.includes(feature)
        ? prevSelected.filter((f) => f !== feature)
        : [...prevSelected, feature]
    );
  };

  const isLoading =
    supportedChainsLoading || isAssetDetailsLoading || mobulaBlockchainLoading;

  const getLabelClass = (label: string) => {
    switch (label) {
      case "token":
        return "tooltip-token";
      case "staking":
        return "tooltip-staking";
      default:
        return "";
    }
  };

  return (
    <main className="flex-1 mx-auto w-full flex flex-col auto-rows-max gap-4 p-4 md:p-8 max-h-[100vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <CardTitle>Supported Chains</CardTitle>
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
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <Card className="xl:col-span-2 bg-muted/70">
          <CardContent>
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                {filteredChains?.map((chain) => {
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
                              <span className="tooltip-content">
                                Coming Soon
                              </span>
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
                id="show-testnets"
                checked={showTestnets}
                onCheckedChange={handleCheckboxChange}
                className="mr-2"
              />
              <label
                htmlFor="show-testnets"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Show testnets
              </label>
            </div>
            {showTestnets && (
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
                        <h1 className="text-lg font-bold md:text-1xl">
                          {chain}
                        </h1>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
