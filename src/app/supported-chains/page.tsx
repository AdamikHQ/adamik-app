"use client";

import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useGetCoinGeckoCoinList } from "~/hooks/useCoinGeckoCoinList";
import { useGetSupportedChainsIds } from "~/hooks/useGetSupportedChainsIds";
import { CoinIdMapperCoinGeckoToAdamik } from "~/lib/utils";

const comingSoonIds = ["tron", "the-open-network", "solana"];

export default function SupportedChains() {
  const { isLoading, data: supportedChains } = useGetSupportedChainsIds();
  const { isLoading: isCoinListLoading, data: coinList } =
    useGetCoinGeckoCoinList();

  console.log({ coinList, supportedChains });
  return (
    <main className="flex-1 mx-auto w-full flex flex-col auto-rows-max gap-4 p-4 md:p-8">
      <div className="flex flex-col">
        <Card className="xl:col-span-2 bg-muted/70">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Supported Chains</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isCoinListLoading || isLoading ? (
              <>
                <Loader2 />
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                {coinList?.map((coin) => {
                  const isComingSoon = comingSoonIds.includes(coin.id);
                  if (
                    (supportedChains &&
                      supportedChains.chains?.includes(
                        CoinIdMapperCoinGeckoToAdamik(coin.id)
                      )) ||
                    isComingSoon
                  )
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
            )}
            <div className="flex flex-row justify-center mt-4">
              <Button>{"Can't find your token, reach out !"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
