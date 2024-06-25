"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useGetCoinGeckoCoinList } from "~/hooks/useCoinGeckoCoinList";
import { CoinIdMapperCoinGeckoToAdamik } from "~/utils/helper";
import { Checkbox } from "~/components/ui/checkbox";
import { useChains } from "~/hooks/useChains";

const comingSoonIds = ["tron", "the-open-network", "solana"];

export default function SupportedChains() {
  const { isLoading, data: supportedChains } = useChains();
  const { isLoading: isCoinListLoading, data: coinList } =
    useGetCoinGeckoCoinList();
  const [showTestnets, setShowTestnets] = useState(false);

  const handleCheckboxChange = () => {
    setShowTestnets(!showTestnets);
  };

  const supportedChainIds =
    Object.keys(supportedChains?.chains || {}).map(
      CoinIdMapperCoinGeckoToAdamik
    ) || [];
  const displayedChainIds =
    coinList
      ?.map((coin) => CoinIdMapperCoinGeckoToAdamik(coin.id))
      .filter(
        (id) => supportedChainIds.includes(id) || comingSoonIds.includes(id)
      ) || [];
  const additionalChains = supportedChainIds.filter(
    (id) => !displayedChainIds.includes(id)
  );

  return (
    <main className="flex-1 mx-auto w-full flex flex-col auto-rows-max gap-4 p-4 md:p-8">
      <div className="flex flex-col">
        <Card className="xl:col-span-2 bg-muted/70">
          <CardHeader className="flex flex-row items-center">
            <CardTitle>Supported Chains</CardTitle>
          </CardHeader>
          <CardContent>
            {isCoinListLoading || isLoading ? (
              <>
                <Loader2 />
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                  {coinList?.map((coin) => {
                    const isComingSoon = comingSoonIds.includes(coin.id);
                    const isSupported = Object.keys(
                      supportedChains?.chains || {}
                    )?.includes(CoinIdMapperCoinGeckoToAdamik(coin.id));
                    if (isSupported || isComingSoon)
                      return (
                        <div
                          key={coin.symbol}
                          className="flex flex-row gap-4 items-center bg-primary/10 p-4 rounded-md"
                        >
                          <Avatar>
                            <AvatarImage src={coin.image} alt={coin.name} />
                            <AvatarFallback>{coin.symbol}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <h1 className="text-lg font-bold md:text-2xl">
                              {coin.name}
                            </h1>
                            <div className="flex flex-row gap-2 uppercase">
                              <h2 className="text-md font-semibold">
                                {coin.symbol}
                              </h2>
                              {isComingSoon && <Badge>Coming Soon</Badge>}
                            </div>
                          </div>
                        </div>
                      );
                  })}
                </div>
              </>
            )}
            <div className="flex flex-row justify-center mt-4">
              <Button asChild>
                <Link href="https://adamik.io/contact">
                  {"Can't find your token, reach out !"}
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
