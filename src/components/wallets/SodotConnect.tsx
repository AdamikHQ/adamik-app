import React, { useCallback, useState, useEffect } from "react";
import { useToast } from "~/components/ui/use-toast";
import { useWallet } from "~/hooks/useWallet";
import { Account, WalletConnectorProps, WalletName } from "./types";
import { Chain } from "~/utils/types";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { useChains } from "~/hooks/useChains";
import { encodePubKeyToAddress } from "~/api/adamik/encode";
import { Card } from "~/components/ui/card";
import { defaultChain, getPreferredChains } from "~/config/wallet-chains";

// Removed DEFAULT_CHAINS constant as it's now in the config file

export const SodotConnect: React.FC<WalletConnectorProps> = ({
  chainId: providedChainId,
  transactionPayload,
}) => {
  const { toast } = useToast();
  const { addAddresses } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<string>(
    providedChainId || ""
  );
  const [autoConnectInProgress, setAutoConnectInProgress] = useState(false);
  const { data: chains, isLoading: chainsLoading } = useChains();

  // Set initial chain when data is loaded
  useEffect(() => {
    if (chains && !providedChainId && !selectedChainId && !transactionPayload) {
      const preferredChains = getPreferredChains(chains);
      const firstAvailableChain =
        preferredChains.length > 0
          ? preferredChains[0]
          : defaultChain in chains
          ? defaultChain
          : Object.keys(chains)[0];

      if (firstAvailableChain) {
        setSelectedChainId(firstAvailableChain);
      }
    }
  }, [chains, providedChainId, selectedChainId, transactionPayload]);

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
    const pubkey = data.data.pubkey;

    const { address } = await encodePubKeyToAddress(pubkey, chainId);
    return { pubkey, address };
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

      const account: Account = {
        address: address,
        chainId: selectedChainId,
        pubKey: pubkey,
        signer: WalletName.SODOT,
      };

      addAddresses([account]);

      toast({
        description: `Connected ${
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

  // Auto connect when using non-transaction mode
  useEffect(() => {
    if (
      chains &&
      selectedChainId &&
      !transactionPayload &&
      !providedChainId &&
      !autoConnectInProgress
    ) {
      // Auto-connect the wallet when chains are loaded and chain is selected
      setAutoConnectInProgress(true);
      getAddresses().finally(() => {
        setAutoConnectInProgress(false);
      });
    }
  }, [
    chains,
    selectedChainId,
    transactionPayload,
    providedChainId,
    autoConnectInProgress,
    getAddresses,
  ]);

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

  // Otherwise, just show the connect button
  return (
    <Card className="p-4 w-full">
      <h3 className="text-lg font-medium mb-4">Connect Sodot Wallet</h3>
      <div className="space-y-4">
        <Button
          className="w-full"
          onClick={() => getAddresses()}
          disabled={!selectedChainId || loading || autoConnectInProgress}
        >
          {loading || autoConnectInProgress ? (
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
