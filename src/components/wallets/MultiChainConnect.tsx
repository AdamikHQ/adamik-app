import React, { useCallback, useState, useEffect } from "react";
import { useToast } from "~/components/ui/use-toast";
import { useWallet } from "~/hooks/useWallet";
import { Account, WalletName } from "./types";
import { Chain } from "~/utils/types";
import { Button } from "~/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { getChains } from "~/api/adamik/chains";
import { encodePubKeyToAddress } from "~/api/adamik/encode";
import { Card } from "~/components/ui/card";
import { getPreferredChains } from "~/config/wallet-chains";
import { Progress } from "~/components/ui/progress";

/**
 * MultiChainConnect component
 * Automatically connects to all chains defined in the wallet-chains.ts config file
 */
export const MultiChainConnect: React.FC = () => {
  const { toast } = useToast();
  const { addAddresses } = useWallet();
  const [loading, setLoading] = useState(false);
  const [chains, setChains] = useState<Record<string, Chain> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectedCount, setConnectedCount] = useState(0);
  const [configuredChains, setConfiguredChains] = useState<string[]>([]);

  // Fetch chains data when component mounts
  useEffect(() => {
    const fetchChains = async () => {
      try {
        const chainsData = await getChains();
        if (chainsData) {
          setChains(chainsData);
          const preferredChains = getPreferredChains(chainsData);
          setConfiguredChains(preferredChains);
        } else {
          setError("Failed to load chain information");
        }
      } catch (e) {
        console.error("Error fetching chains:", e);
        setError("Failed to load chain information");
      }
    };

    fetchChains();
  }, []);

  const getAddressForChain = async (chainId: string) => {
    if (!chains || !chains[chainId]) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    // Call our backend endpoint for the chain pubkey
    console.log(`[MultiChainConnect] Fetching pubkey for ${chainId}`);
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
    console.log(
      `[MultiChainConnect] Received pubkey data for ${chainId}:`,
      data
    );

    // Get the pubkey from the response
    const pubkey = data.data.pubkey;
    console.log(`[MultiChainConnect] Extracted ${chainId} pubkey:`, pubkey);

    // Use the encodePubKeyToAddress API endpoint directly
    console.log(`[MultiChainConnect] Encoding address for ${chainId}`);

    try {
      const { address } = await encodePubKeyToAddress(pubkey, chainId);
      console.log(`[MultiChainConnect] Address for ${chainId}:`, address);
      return { pubkey, address };
    } catch (e) {
      console.error(`[MultiChainConnect] Error encoding address:`, e);
      throw new Error(
        `Failed to encode address: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  };

  const connectAllChains = useCallback(async () => {
    if (!chains || configuredChains.length === 0) {
      toast({
        description: "No chains configured or available",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setConnectedCount(0);

    const accounts: Account[] = [];
    const failedChains: string[] = [];

    // Connect to each chain in sequence
    for (let i = 0; i < configuredChains.length; i++) {
      const chainId = configuredChains[i];
      try {
        const { pubkey, address } = await getAddressForChain(chainId);

        // Create account with the address and public key
        const account: Account = {
          address: address,
          chainId: chainId,
          pubKey: pubkey,
          signer: WalletName.SODOT,
        };

        accounts.push(account);
        setConnectedCount(i + 1);
      } catch (e) {
        console.error(`Error connecting to ${chainId}:`, e);
        failedChains.push(chainId);
      }
    }

    // Add all successfully connected accounts
    if (accounts.length > 0) {
      addAddresses(accounts);

      toast({
        description: `Connected ${accounts.length} chains successfully${
          failedChains.length > 0
            ? `. Failed to connect: ${failedChains.join(", ")}`
            : ""
        }`,
      });
    } else {
      toast({
        description: "Failed to connect any chains",
        variant: "destructive",
      });
    }

    setLoading(false);
  }, [chains, configuredChains, addAddresses, toast]);

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

  return (
    <Card className="p-4 w-full">
      <h3 className="text-lg font-medium mb-4">Connect Sodot Wallet</h3>
      <div className="space-y-4">
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Connecting chains...</span>
              <span>
                {connectedCount} / {configuredChains.length}
              </span>
            </div>
            <Progress
              value={(connectedCount / configuredChains.length) * 100}
              className="h-2"
            />
          </div>
        )}

        <Button
          className="w-full"
          onClick={connectAllChains}
          disabled={loading || configuredChains.length === 0}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting multiple chains...
            </>
          ) : (
            <>Connect {configuredChains.length} Chains</>
          )}
        </Button>
      </div>
    </Card>
  );
};
