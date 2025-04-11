import React, { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useToast } from "~/components/ui/use-toast";
import { useWallet } from "~/hooks/useWallet";
import { getChains } from "~/api/adamik/chains";
import { Chain } from "~/utils/types";
import { getPreferredChains } from "~/config/wallet-chains";
import { encodePubKeyToAddress } from "~/api/adamik/encode";
import { Account, WalletName } from "./types";
import { ChevronDown } from "lucide-react";

export function ChainSelector() {
  const { toast } = useToast();
  const { addresses, addAddresses, removeAddresses } = useWallet();
  const [chains, setChains] = useState<Record<string, Chain> | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);

  // Fetch chains on mount
  useEffect(() => {
    const fetchChains = async () => {
      try {
        const chainsData = await getChains();
        if (chainsData) {
          setChains(chainsData);
          // Set initially selected chains based on wallet-chains.ts
          const preferredChains = getPreferredChains(chainsData);
          setSelectedChains(preferredChains);
        }
      } catch (e) {
        console.error("Error fetching chains:", e);
        toast({
          description: "Failed to load chain information",
          variant: "destructive",
        });
      }
    };

    fetchChains();
  }, [toast]);

  // Update selected chains when addresses change
  useEffect(() => {
    const connectedChainIds = addresses.map((addr) => addr.chainId);
    setSelectedChains(connectedChainIds);
  }, [addresses]);

  const connectChain = async (chainId: string) => {
    if (!chains?.[chainId]) return;

    setLoading(true);
    try {
      // Get chain public key
      const response = await fetch(
        `/api/sodot-proxy/derive-chain-pubkey?chain=${chainId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get chain public key");
      }

      const data = await response.json();
      const pubkey = data.data.pubkey;

      // Get address from public key
      const { address } = await encodePubKeyToAddress(pubkey, chainId);

      // Create and add account
      const account: Account = {
        address,
        chainId,
        pubKey: pubkey,
        signer: WalletName.SODOT,
      };

      addAddresses([account]);
      toast({
        description: `Connected ${chains[chainId].name}`,
      });
    } catch (e) {
      console.error(`Error connecting to ${chainId}:`, e);
      toast({
        description: `Failed to connect ${chains[chainId].name}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectChain = (chainId: string) => {
    const accountToRemove = addresses.find((addr) => addr.chainId === chainId);
    if (accountToRemove) {
      removeAddresses([accountToRemove]);
      toast({
        description: `Disconnected ${chains?.[chainId]?.name || chainId}`,
      });
    }
  };

  const handleChainToggle = async (chainId: string, checked: boolean) => {
    if (checked) {
      await connectChain(chainId);
    } else {
      disconnectChain(chainId);
    }
  };

  if (!chains) {
    return (
      <Button variant="secondary" size="sm" disabled>
        Loading chains...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="font-medium"
          disabled={loading}
        >
          {addresses.length} {addresses.length === 1 ? "Chain" : "Chains"}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <ScrollArea className="h-[300px] p-2">
          <div className="space-y-2">
            {Object.entries(chains)
              .sort(([, a], [, b]) => a.name.localeCompare(b.name))
              .map(([chainId, chain]) => (
                <label
                  key={chainId}
                  className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={selectedChains.includes(chainId)}
                    onCheckedChange={(checked) =>
                      handleChainToggle(chainId, checked as boolean)
                    }
                    disabled={loading}
                  />
                  <span className="text-sm">{chain.name}</span>
                </label>
              ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
