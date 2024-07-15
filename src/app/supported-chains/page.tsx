"use client";

import { Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MobulaMarketMultiDataResponse } from "~/api/mobula/marketMultiData";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Tooltip } from "~/components/ui/tooltip"; // Import TooltipProvider
import { useChains } from "~/hooks/useChains";
import { useMobulaBlockchains } from "~/hooks/useMobulaBlockchains";
import { useMobulaMarketMultiData } from "~/hooks/useMobulaMarketMultiData";
import { resolveLogo } from "~/utils/helper";
import { SupportedBlockchain } from "~/utils/types";

const comingSoonIds = ["tron", "the-open-network", "solana"];

export default function SupportedChains() {
  const { isLoading: supportedChainsLoading, data: supportedChains } =
    useChains();
  const [showTestnets, setShowTestnets] = useState(false);
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
      const supportedChain = {
        ...chain,
        logo: resolveLogo({
          asset: { name: chain.name, ticker: chain.ticker },
          mobulaMarketData,
          mobulaBlockChainData: mobulaBlockchains,
        }),
      };
      return [...acc, supportedChain];
    }, [])
    .sort((a, b) => a.name.localeCompare(b.name));

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

  const isLoading =
    supportedChainsLoading || isAssetDetailsLoading || mobulaBlockchainLoading;

  return (
    <main className="flex-1 mx-auto w-full flex flex-col auto-rows-max gap-4 p-4 md:p-8 max-h-[100vh] overflow-y-auto">
      <div className="flex flex-col">
        <Card className="xl:col-span-2 bg-muted/70">
          <CardHeader className="flex flex-row items-center">
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
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                {chainsWithInfo?.map((chain) => {
                  const isComingSoon = comingSoonIds.includes(chain.id);

                  return (
                    <div
                      key={chain.id}
                      className="flex flex-row gap-4 items-center bg-primary/10 p-4 rounded-md"
                    >
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
                          {isComingSoon && <Badge>Coming Soon</Badge>}
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
