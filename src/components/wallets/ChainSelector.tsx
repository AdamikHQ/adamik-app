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
import { useExtendedChains } from "~/hooks/useExtendedChains";
import { Chain } from "~/utils/types";
import { getPreferredChains } from "~/config/wallet-chains";
import { encodePubKeyToAddress } from "~/api/adamik/encode";
import { Account, WalletName } from "./types";
import { ChevronDown, Clock, Shield } from "lucide-react";
import { SignerFactory } from "~/signers/SignerFactory";
import { SignerType, SIGNER_CONFIGS } from "~/signers/types";

export function ChainSelector() {
  const { toast } = useToast();
  const { addresses, addAddresses, removeAddresses } = useWallet();
  const [loading, setLoading] = useState(false);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const { data: chains, isLoading: chainsLoading } = useExtendedChains();

  useEffect(() => {
    if (chains) {
      const preferredChains = getPreferredChains(chains);
      setSelectedChains(preferredChains);
    }
  }, [chains]);

  useEffect(() => {
    const connectedChainIds = addresses.map((addr) => addr.chainId);
    setSelectedChains(connectedChainIds);
  }, [addresses]);

  const connectChain = async (chainId: string) => {
    if (!chains?.[chainId]) return;

    // Don't allow connecting to chains marked as coming soon
    if ("comingSoon" in chains[chainId] && chains[chainId].comingSoon) {
      toast({
        description: `${chains[chainId].name} is coming soon and not available yet`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get the selected signer type from settings
      const selectedSigner = SignerFactory.getSelectedSignerType();
      const walletName = selectedSigner === SignerType.IOFINNET 
        ? WalletName.IOFINNET 
        : WalletName.SODOT;

      // Get chain public key using the selected signer
      const pubkey = await SignerFactory.getChainPubkey(chainId);
      const { address } = await encodePubKeyToAddress(pubkey, chainId);

      const account: Account = {
        address,
        chainId,
        pubKey: pubkey,
        signer: walletName,
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
              .filter(([chainId]) => {
                // Filter out Starknet chains when using IoFinnet (unsupported curve)
                const selectedSigner = SignerFactory.getSelectedSignerType();
                if (selectedSigner === SignerType.IOFINNET && 
                    (chainId === 'starknet' || chainId === 'starknet-sepolia')) {
                  return false;
                }
                return true;
              })
              .sort(([, a], [, b]) => a.name.localeCompare(b.name))
              .map(([chainId, chain]) => {
                const isComingSoon = "comingSoon" in chain && chain.comingSoon;

                return (
                  <label
                    key={chainId}
                    className={`flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent ${
                      isComingSoon ? "opacity-60" : "cursor-pointer"
                    }`}
                  >
                    <Checkbox
                      checked={selectedChains.includes(chainId)}
                      onCheckedChange={(checked) =>
                        handleChainToggle(chainId, checked as boolean)
                      }
                      disabled={loading || isComingSoon}
                    />
                    <div className="flex items-center space-x-1">
                      <span className="text-sm">{chain.name}</span>
                      {isComingSoon && (
                        <div className="flex items-center text-xs text-muted-foreground space-x-1 ml-1">
                          <Clock className="h-3 w-3" />
                          <span>Soon</span>
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
          </div>
        </ScrollArea>
        
        {/* Powered by indicator */}
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-t bg-muted/50">
          <Shield className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Powered by {SIGNER_CONFIGS[SignerFactory.getSelectedSignerType()].displayName}
          </span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
