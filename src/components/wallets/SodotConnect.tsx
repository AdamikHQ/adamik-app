import React, { useCallback, useState, useEffect } from "react";
import { useToast } from "~/components/ui/use-toast";
import { useWallet } from "~/hooks/useWallet";
import { Account, WalletConnectorProps, WalletName } from "./types";
import { Chain } from "~/utils/types";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { getChains } from "~/api/adamik/chains";
import { encodePubKeyToAddress } from "~/api/adamik/encode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card } from "~/components/ui/card";

// Default chains to show in the UI
const DEFAULT_CHAINS = ["ethereum", "bitcoin", "solana"];

export const SodotConnect: React.FC<WalletConnectorProps> = ({
  chainId: providedChainId,
  transactionPayload,
}) => {
  const { toast } = useToast();
  const { addAddresses } = useWallet();
  const [loading, setLoading] = useState(false);
  const [chains, setChains] = useState<Record<string, Chain> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<string>(
    providedChainId || ""
  );

  // Fetch chains data when component mounts
  useEffect(() => {
    const fetchChains = async () => {
      try {
        const chainsData = await getChains();
        if (chainsData) {
          setChains(chainsData);

          // Auto-select first chain if none provided and we're not in transaction mode
          if (!providedChainId && !selectedChainId && !transactionPayload) {
            const firstDefaultChain = DEFAULT_CHAINS.find(
              (id) => chainsData[id]
            );
            if (firstDefaultChain) {
              setSelectedChainId(firstDefaultChain);
            }
          }
        } else {
          setError("Failed to load chain information");
        }
      } catch (e) {
        console.error("Error fetching chains:", e);
        setError("Failed to load chain information");
      }
    };

    fetchChains();
  }, [providedChainId, selectedChainId, transactionPayload]);

  // Update selected chain when providedChainId changes
  useEffect(() => {
    if (providedChainId) {
      setSelectedChainId(providedChainId);
    }
  }, [providedChainId]);

  const getAddressForChain = async (chainId: string) => {
    if (!chains || !chains[chainId]) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    // Call our backend endpoint for the chain pubkey
    console.log(`[SodotConnect] Fetching pubkey for ${chainId}`);
    const response = await fetch(
      `/api/sodot-proxy/derive-chain-pubkey?chain=${chainId}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(`[SodotConnect] Received pubkey data for ${chainId}:`, data);

    // Get the pubkey from the response
    const pubkey = data.data.pubkey;
    console.log(`[SodotConnect] Extracted ${chainId} pubkey:`, pubkey);

    // Use the encodePubKeyToAddress API endpoint directly
    console.log(`[SodotConnect] Encoding address for ${chainId}`);

    try {
      const { address } = await encodePubKeyToAddress(pubkey, chainId);
      console.log(`[SodotConnect] Address for ${chainId}:`, address);
      return { pubkey, address };
    } catch (e) {
      console.error(`[SodotConnect] Error encoding address:`, e);
      throw new Error(
        `Failed to encode address: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  };

  const getAddresses = useCallback(async () => {
    if (!chains || !selectedChainId) {
      toast({
        description: "Please select a chain",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { pubkey, address } = await getAddressForChain(selectedChainId);

      // Create account with the address and public key
      const account: Account = {
        address: address,
        chainId: selectedChainId,
        pubKey: pubkey,
        signer: WalletName.SODOT,
      };

      addAddresses([account]);

      toast({
        description: `Connected Sodot Wallet for ${
          chains[selectedChainId]?.name || selectedChainId
        }`,
      });
    } catch (e) {
      console.error("Sodot connection error:", e);
      toast({
        description: `Failed to connect to Sodot Wallet: ${
          e instanceof Error ? e.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedChainId, addAddresses, toast, chains]);

  const sign = useCallback(async () => {
    if (!transactionPayload || !chains || !providedChainId) return;

    setLoading(true);

    try {
      // Call the API to sign the transaction
      const response = await fetch(`/api/sodot-proxy/${providedChainId}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction: transactionPayload.encoded,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      const signature = data.signature;

      console.log("Transaction signed:", signature);

      toast({
        description: "Transaction signed successfully",
      });
    } catch (err) {
      console.warn("Failed to sign with Sodot wallet:", err);
      toast({
        description: err instanceof Error ? err.message : "Transaction failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [providedChainId, transactionPayload, toast, chains]);

  if (error) {
    return (
      <Button className="w-full" disabled>
        Error: {error}
      </Button>
    );
  }

  if (!chains) {
    return (
      <Button className="w-full" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading chain info...
      </Button>
    );
  }

  // If a specific chainId is provided or we're signing a transaction, show simple connect/sign button
  if (providedChainId || transactionPayload) {
    return (
      <Button
        className="w-full"
        onClick={transactionPayload ? () => sign() : () => getAddresses()}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {transactionPayload ? "Signing..." : "Connecting..."}
          </>
        ) : transactionPayload ? (
          "Sign Transaction"
        ) : (
          "Connect Sodot Wallet"
        )}
      </Button>
    );
  }

  // If no chainId is provided, show chain selector with default chains
  return (
    <Card className="p-4 w-full">
      <h3 className="text-lg font-medium mb-4">Connect Sodot Wallet</h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Select Chain</label>
          <Select
            value={selectedChainId}
            onValueChange={setSelectedChainId}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a chain" />
            </SelectTrigger>
            <SelectContent>
              {/* Show default chains first */}
              {DEFAULT_CHAINS.map(
                (chainId) =>
                  chains[chainId] && (
                    <SelectItem key={chainId} value={chainId}>
                      {chains[chainId].name} ({chains[chainId].ticker})
                    </SelectItem>
                  )
              )}
              <SelectItem disabled value="divider">
                — All Chains —
              </SelectItem>
              {/* Then show all chains */}
              {Object.entries(chains)
                .filter(([chainId]) => !DEFAULT_CHAINS.includes(chainId))
                .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                .map(([chainId, chain]) => (
                  <SelectItem key={chainId} value={chainId}>
                    {chain.name} ({chain.ticker})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="w-full"
          onClick={() => getAddresses()}
          disabled={!selectedChainId || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect"
          )}
        </Button>
      </div>
    </Card>
  );
};
