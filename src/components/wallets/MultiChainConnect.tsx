import React, {
  useCallback,
  useState,
  useEffect,
  RefObject,
  forwardRef,
} from "react";
import { useToast } from "~/components/ui/use-toast";
import { useWallet } from "~/hooks/useWallet";
import { Account, WalletName } from "./types";
import { Chain } from "~/utils/types";
import { Button } from "~/components/ui/button";
import { Loader2, ChevronRight } from "lucide-react";
import { useChains } from "~/hooks/useChains";
import { encodePubKeyToAddress } from "~/api/adamik/encode";
import { getPreferredChains } from "~/config/wallet-chains";

/**
 * MultiChainConnect component
 * Automatically connects to all chains defined in the wallet-chains.ts config file
 * Simplified to just a button for top-right placement
 */
export const MultiChainConnect: React.FC<{
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  hideButton?: boolean; // Add hideButton prop to hide the button when needed
}> = ({
  variant = "default",
  size = "default",
  className = "",
  hideButton = false,
}) => {
  const { toast } = useToast();
  const { addAddresses, isShowroom } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedCount, setConnectedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedChains, setFailedChains] = useState<string[]>([]);
  const [configuredChains, setConfiguredChains] = useState<string[]>([]);
  const { data: chains, isLoading: chainsLoading } = useChains();

  useEffect(() => {
    if (chains) {
      const preferredChains = getPreferredChains(chains);
      setConfiguredChains(preferredChains);
    }
  }, [chains]);

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
    return { pubkey, address, chainId };
  };

  const handleSuccessfulConnection = useCallback(
    (result: { pubkey: string; address: string; chainId: string }) => {
      const account: Account = {
        address: result.address,
        chainId: result.chainId,
        pubKey: result.pubkey,
        signer: WalletName.SODOT,
      };

      addAddresses([account]);

      toast({
        description: `Connected ${
          chains?.[result.chainId]?.name || result.chainId
        }`,
        duration: 1500,
      });

      setSuccessCount((prev) => prev + 1);
    },
    [addAddresses, toast, chains]
  );

  // Handle failed chain connection
  const handleFailedConnection = useCallback(
    (chainId: string, error: Error) => {
      console.error(`Error connecting to ${chainId}:`, error);

      setFailedChains((prev) => [...prev, chainId]);

      // Optionally show an error toast for each failure
      toast({
        description: `Failed to connect ${
          chains?.[chainId]?.name || chainId
        }: ${error.message}`,
        variant: "destructive",
        duration: 2000,
      });
    },
    [chains, toast]
  );

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
    setSuccessCount(0);
    setFailedChains([]);

    // Process each chain individually
    configuredChains.forEach((chainId) => {
      getAddressForChain(chainId)
        .then((result) => {
          // Process this successful result immediately
          handleSuccessfulConnection(result);
        })
        .catch((error) => {
          // Process this failure immediately
          handleFailedConnection(chainId, error);
        })
        .finally(() => {
          // Update connection counter
          setConnectedCount((prev) => prev + 1);

          // Check if all chains have been processed
          if (connectedCount + 1 >= configuredChains.length) {
            // Show final summary toast when all chains have been processed
            setTimeout(() => {
              toast({
                description: `Completed: ${successCount + 1} successful, ${
                  failedChains.length
                } failed`,
              });

              setLoading(false);
            }, 500);
          }
        });
    });
  }, [
    chains,
    configuredChains,
    handleSuccessfulConnection,
    handleFailedConnection,
    connectedCount,
    successCount,
    failedChains.length,
    toast,
    getAddressForChain,
  ]);

  // Clean up when finished
  useEffect(() => {
    if (
      connectedCount === configuredChains.length &&
      loading &&
      configuredChains.length > 0
    ) {
      // Show summary and set loading to false
      toast({
        description: `All chains processed: ${successCount} successful, ${failedChains.length} failed`,
      });

      setLoading(false);
    }
  }, [
    connectedCount,
    configuredChains.length,
    loading,
    successCount,
    failedChains.length,
    toast,
  ]);

  // If hideButton is true, don't render anything - moved after hooks to avoid conditional hook calls
  if (hideButton) {
    return null;
  }

  if (error) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        Error
      </Button>
    );
  }

  if (!chains) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  // Button is only visible when not hidden with hideButton prop
  return (
    <Button
      id="multi-chain-connect-button"
      variant={variant}
      size={size}
      className={`${className} bg-primary hover:bg-primary/90 text-primary-foreground font-medium`}
      onClick={connectAllChains}
      disabled={loading || configuredChains.length === 0}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {connectedCount}/{configuredChains.length}
        </>
      ) : (
        <>Connect {isShowroom ? "Demo " : ""}Wallet</>
      )}
    </Button>
  );
};
