import React, {
  useCallback,
  useState,
  useEffect,
  RefObject,
  forwardRef,
  useMemo,
} from "react";
import { useToast } from "~/components/ui/use-toast";
import { useWallet } from "~/hooks/useWallet";
import { Account, WalletName } from "./types";
import { Chain, SupportedBlockchain } from "~/utils/types";
import { Button } from "~/components/ui/button";
import { Loader2, ChevronRight, Search, Check, Clock, Shield } from "lucide-react";
import { useExtendedChains, ExtendedChain } from "~/hooks/useExtendedChains";
import { encodePubKeyToAddress } from "~/api/adamik/encode";
import { getPreferredChains } from "~/config/wallet-chains";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { CustomProgress } from "~/components/ui/custom-progress";
import { SignerFactory } from "~/signers/SignerFactory";
import { SIGNER_CONFIGS, SignerType } from "~/signers/types";
import { isChainCompatibleWithSigner, getIncompatibilityReason } from "~/utils/signerChainCompatibility";

/**
 * ChainItem component for rendering individual chain items
 */
const ChainItem = forwardRef<
  HTMLDivElement,
  {
    chainId: string;
    chain: ExtendedChain;
    isSelected: boolean;
    isConnected?: boolean;
    isIncompatible?: boolean;
    incompatibilityReason?: string;
    onToggle: () => void;
  }
>(({ chainId, chain, isSelected, isConnected = false, isIncompatible = false, incompatibilityReason, onToggle }, ref) => {
  const isComingSoon = "comingSoon" in chain && chain.comingSoon;
  const isDisabled = isComingSoon || isIncompatible;

  return (
    <div
      ref={ref}
      className={`flex items-center justify-between p-3 rounded-lg ${
        isSelected && !isDisabled ? "bg-accent" : ""
      } ${isDisabled ? "opacity-50" : "cursor-pointer hover:bg-accent"}`}
      onClick={!isDisabled ? onToggle : undefined}
      title={isIncompatible ? incompatibilityReason : undefined}
    >
      <div className="flex items-center gap-3">
        {chain.logo && (
          <img
            src={chain.logo}
            alt={`${chain.name} logo`}
            className="w-6 h-6 rounded-full"
          />
        )}
        <div className="flex items-center">
          <span className={isIncompatible ? "line-through" : ""}>{chain.name}</span>
          {isComingSoon && (
            <div className="flex items-center text-xs text-muted-foreground space-x-1 ml-2">
              <Clock className="h-3 w-3" />
              <span>Soon</span>
            </div>
          )}
          {isIncompatible && (
            <div className="flex items-center text-xs text-muted-foreground space-x-1 ml-2">
              <span className="text-orange-500">Unsupported</span>
            </div>
          )}
        </div>
      </div>
      {isSelected && !isDisabled && (
        <Check className="w-4 h-4 text-primary" />
      )}
    </div>
  );
});

ChainItem.displayName = "ChainItem";

/**
 * Separator component for visual division
 */
const Separator = ({ className = "" }: { className?: string }) => (
  <div className={`h-px bg-border ${className}`} />
);

/**
 * MultiChainConnect component
 * Automatically connects to all chains defined in the wallet-chains.ts config file
 * Enhanced with search and better organization of chains
 */
export const MultiChainConnect: React.FC<{
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  hideButton?: boolean;
}> = ({
  variant = "default",
  size = "default",
  className = "",
  hideButton = false,
}) => {
  const { toast } = useToast();
  const { addAddresses, removeAddresses, isShowroom, addresses } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedCount, setConnectedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedChains, setFailedChains] = useState<string[]>([]);
  const [configuredChains, setConfiguredChains] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const { data: chains, isLoading: chainsLoading } = useExtendedChains();

  // Get unique chain IDs from connected addresses
  const uniqueConnectedChainIds = useMemo(
    () => [...new Set(addresses.map((addr) => addr.chainId))],
    [addresses]
  );

  useEffect(() => {
    if (chains) {
      const preferredChains = getPreferredChains(chains);
      setConfiguredChains(preferredChains);
    }
  }, [chains]);

  // When opening the selection modal, pre-select already connected chains
  useEffect(() => {
    if (isSelectionOpen && !isShowroom) {
      // Get the current signer to filter chains
      const currentSigner = SignerFactory.getSelectedSignerType();
      const walletName = currentSigner === SignerType.IOFINNET 
        ? WalletName.IOFINNET 
        : currentSigner === SignerType.TURNKEY
        ? WalletName.TURNKEY
        : currentSigner === SignerType.BLOCKDAEMON
        ? WalletName.BLOCKDAEMON
        : WalletName.SODOT;
      
      // Filter addresses to only those from the current signer
      const currentSignerAddresses = addresses.filter(addr => addr.signer === walletName);
      const currentSignerChainIds = [...new Set(currentSignerAddresses.map(addr => addr.chainId))];
      
      // First try to load any previously selected chains from localStorage
      try {
        const clientState = localStorage.getItem("AdamikClientState");
        if (clientState) {
          const parsedState = JSON.parse(clientState);

          // Check if the user has explicitly disconnected all chains
          if (parsedState.hasManuallyDisconnected === true) {
            // User previously disconnected all chains, don't pre-select anything
            setSelectedChains([]);
            return;
          }

          // Store signer-specific selections
          const signerKey = `defaultChains_${currentSigner}`;
          if (
            parsedState[signerKey] &&
            Array.isArray(parsedState[signerKey])
          ) {
            // Load user's custom selection for this specific signer
            setSelectedChains(parsedState[signerKey]);
            return;
          }
        }
      } catch (error) {
        console.error("Error loading previously selected chains:", error);
      }

      // If no custom selection exists, use currently connected chains for this signer
      if (currentSignerChainIds.length > 0) {
        setSelectedChains(currentSignerChainIds);
        return;
      }

      // For new signers with no connections, start with empty selection
      setSelectedChains([]);
    }
  }, [isSelectionOpen, isShowroom, addresses]);

  // Filter and sort chains based on search query and selection status
  const { selectedChainsList, unselectedChainsList, incompatibleChains } = React.useMemo(() => {
    if (!chains) return { selectedChainsList: [], unselectedChainsList: [], incompatibleChains: new Map() };

    // Get current signer for compatibility check
    const selectedSigner = SignerFactory.getSelectedSignerType();
    const incompatibleChainsMap = new Map<string, string>();

    const allChains = Object.entries(chains)
      .filter(([chainId, chain]) => {
        const matchesSearch = chain.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        return matchesSearch;
      })
      .sort((a, b) => a[1].name.localeCompare(b[1].name));

    // Check compatibility for each chain
    allChains.forEach(([chainId, chain]) => {
      const incompatibilityReason = getIncompatibilityReason(chain, selectedSigner);
      if (incompatibilityReason) {
        incompatibleChainsMap.set(chainId, incompatibilityReason);
      }
    });

    return {
      selectedChainsList: allChains.filter(([chainId, chain]) => {
        // Exclude "coming soon" chains from selected list
        const isComingSoon = "comingSoon" in chain && chain.comingSoon;
        return selectedChains.includes(chainId) && !isComingSoon;
      }),
      unselectedChainsList: allChains.filter(([chainId, chain]) => {
        // Include "coming soon" chains in unselected list, even if they're "selected"
        const isComingSoon = "comingSoon" in chain && chain.comingSoon;
        return !selectedChains.includes(chainId) || isComingSoon;
      }),
      incompatibleChains: incompatibleChainsMap,
    };
  }, [chains, searchQuery, selectedChains]);

  const toggleChain = (chainId: string) => {
    // Don't allow toggling chains marked as coming soon
    if (
      chains &&
      "comingSoon" in chains[chainId] &&
      chains[chainId].comingSoon
    ) {
      toast({
        description: `${chains[chainId].name} is coming soon and not available yet`,
        variant: "destructive",
      });
      return;
    }

    // Don't allow toggling incompatible chains
    if (incompatibleChains.has(chainId)) {
      toast({
        description: incompatibleChains.get(chainId),
        variant: "destructive",
      });
      return;
    }

    // Toggle the chain in the selected list, regardless of connection status
    setSelectedChains((prev) =>
      prev.includes(chainId)
        ? prev.filter((id) => id !== chainId)
        : [...prev, chainId]
    );
  };

  const getAddressForChain = useCallback(
    async (chainId: string) => {
      if (!chains || !chains[chainId]) {
        throw new Error(`Chain ${chainId} not supported`);
      }

      // Don't allow connecting to chains marked as coming soon
      if ("comingSoon" in chains[chainId] && chains[chainId].comingSoon) {
        throw new Error(
          `${chains[chainId].name} is coming soon and not available yet`
        );
      }

      // Get chain public key using the selected signer
      const pubkey = await SignerFactory.getChainPubkey(chainId);

      const { address } = await encodePubKeyToAddress(pubkey, chainId);
      return { pubkey, address, chainId };
    },
    [chains]
  );

  const handleSuccessfulConnection = useCallback(
    (result: { pubkey: string; address: string; chainId: string }) => {
      const currentSigner = SignerFactory.getSelectedSignerType();
      const walletName = currentSigner === SignerType.IOFINNET 
        ? WalletName.IOFINNET 
        : currentSigner === SignerType.TURNKEY
        ? WalletName.TURNKEY
        : currentSigner === SignerType.BLOCKDAEMON
        ? WalletName.BLOCKDAEMON
        : WalletName.SODOT;
        
      const account: Account = {
        address: result.address,
        chainId: result.chainId,
        pubKey: result.pubkey,
        signer: walletName,
      };

      addAddresses([account]);

      // We no longer show individual toasts for each connection
      console.log(
        `Successfully connected ${
          chains?.[result.chainId]?.name || result.chainId
        }`
      );

      setSuccessCount((prev) => prev + 1);
    },
    [addAddresses, chains]
  );

  // Handle failed chain connection
  const handleFailedConnection = useCallback(
    (chainId: string, error: Error) => {
      console.error(`Error connecting to ${chainId}:`, error);
      setFailedChains((prev) => [...prev, chainId]);

      // We no longer show individual toasts for each failure
      console.log(
        `Failed to connect ${chains?.[chainId]?.name || chainId}: ${
          error.message
        }`
      );
    },
    [chains]
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

    // Make sure configuredChains contains only valid chains
    const validChains = configuredChains.filter((chainId) => chains[chainId]);

    let completedCount = 0;
    const totalChains = validChains.length;

    // Create a single progress toast that we'll update
    const progressToast = toast({
      description: (
        <div className="flex flex-col gap-2 w-full min-w-[300px]">
          <div className="flex items-center justify-between w-full">
            <span>Connecting chains...</span>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalChains} chains
            </span>
          </div>
          <CustomProgress value={(completedCount / totalChains) * 100} />
        </div>
      ),
      duration: Infinity,
    });

    // Create array to collect all successful addresses before updating wallet state
    const allNewAccounts: Account[] = [];

    // Process each chain individually
    for (const chainId of validChains) {
      try {
        const result = await getAddressForChain(chainId);

        // Collect the account instead of immediately adding it
        const currentSigner = SignerFactory.getSelectedSignerType();
        const walletName = currentSigner === SignerType.IOFINNET 
          ? WalletName.IOFINNET 
          : currentSigner === SignerType.TURNKEY
          ? WalletName.TURNKEY
          : currentSigner === SignerType.BLOCKDAEMON
          ? WalletName.BLOCKDAEMON
          : WalletName.SODOT;
          
        const account: Account = {
          address: result.address,
          chainId: result.chainId,
          pubKey: result.pubkey,
          signer: walletName,
        };

        allNewAccounts.push(account);
        setSuccessCount((prev) => prev + 1);
      } catch (error) {
        handleFailedConnection(chainId, error as Error);
      } finally {
        completedCount++;
        setConnectedCount((prev) => prev + 1);

        // Update the progress toast
        progressToast.update({
          id: progressToast.id,
          description: (
            <div className="flex flex-col gap-2 w-full min-w-[300px]">
              <div className="flex items-center justify-between w-full">
                <span>Connecting chains...</span>
                <span className="text-sm text-muted-foreground">
                  {completedCount}/{totalChains} chains
                </span>
              </div>
              <CustomProgress value={(completedCount / totalChains) * 100} />
              {failedChains.length > 0 && (
                <div className="text-sm text-red-500">
                  {failedChains.length} connection failure(s)
                </div>
              )}
            </div>
          ),
        });
      }
    }

    // Dismiss the progress toast
    progressToast.dismiss();

    // Only after all chains are processed, update the wallet state once
    if (allNewAccounts.length > 0) {
      addAddresses(allNewAccounts);
    }

    // Show final summary toast
    toast({
      description: `Connected ${successCount} chains successfully${
        failedChains.length > 0 ? `, ${failedChains.length} failed` : ""
      }`,
      duration: 3000,
    });

    setLoading(false);
  }, [
    chains,
    configuredChains,
    handleFailedConnection,
    successCount,
    failedChains,
    toast,
    getAddressForChain,
    addAddresses,
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

  // Calculate the count for display based on mode
  let chainCount = 0;
  let buttonText = "Select Chains";

  if (isShowroom) {
    // In showroom mode, just count the unique chains from addresses
    chainCount = uniqueConnectedChainIds.length;
  } else if (uniqueConnectedChainIds.length > 0) {
    // In regular mode with connected wallets, show actual connected chains
    chainCount = uniqueConnectedChainIds.length;
  } else if (selectedChains.length > 0) {
    // In regular mode with no connections but selections made
    chainCount = selectedChains.length;
  }

  // Set button text based on count
  if (chainCount > 0) {
    buttonText = `${chainCount} Chains Selected`;
  }

  // Button is only visible when not hidden with hideButton prop
  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsSelectionOpen(true)}
        disabled={loading || isShowroom}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <ChevronRight className="w-4 h-4 mr-2" />
        )}
        {buttonText}
      </Button>

      {isSelectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg border border-border">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Select Chains</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSelectionOpen(false)}
                >
                  Close
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-[400px] rounded-md border p-4">
                {selectedChainsList.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">
                      Selected Chains ({selectedChainsList.length})
                    </h3>
                    {selectedChainsList.map(([chainId, chain]) => (
                      <ChainItem
                        key={chainId}
                        chainId={chainId}
                        chain={chain}
                        isSelected={true}
                        isConnected={uniqueConnectedChainIds.includes(chainId)}
                        isIncompatible={incompatibleChains.has(chainId)}
                        incompatibilityReason={incompatibleChains.get(chainId)}
                        onToggle={() => toggleChain(chainId)}
                      />
                    ))}
                    <Separator className="my-4" />
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Available Chains ({unselectedChainsList.length})
                  </h3>
                  {unselectedChainsList.map(([chainId, chain]) => (
                    <ChainItem
                      key={chainId}
                      chainId={chainId}
                      chain={chain}
                      isSelected={false}
                      isConnected={uniqueConnectedChainIds.includes(chainId)}
                      isIncompatible={incompatibleChains.has(chainId)}
                      incompatibilityReason={incompatibleChains.get(chainId)}
                      onToggle={() => toggleChain(chainId)}
                    />
                  ))}
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Just clear the selection without disconnecting
                    setSelectedChains([]);
                    // Don't close the modal - let user confirm with the Disconnect All button
                  }}
                  disabled={selectedChains.length === 0}
                >
                  Clear All
                </Button>
                <Button
                  onClick={() => {
                    // Save the selected chains to localStorage for future use (per signer)
                    try {
                      const currentSigner = SignerFactory.getSelectedSignerType();
                      const signerKey = `defaultChains_${currentSigner}`;
                      const clientState =
                        localStorage.getItem("AdamikClientState") || "{}";
                      const parsedState = JSON.parse(clientState);
                      localStorage.setItem(
                        "AdamikClientState",
                        JSON.stringify({
                          ...parsedState,
                          [signerKey]: selectedChains,
                          // If user has selected at least one chain, they are no longer in "disconnected all" mode
                          hasManuallyDisconnected: selectedChains.length === 0,
                        })
                      );
                    } catch (error) {
                      console.error("Error saving selected chains:", error);
                    }

                    setIsSelectionOpen(false);

                    // If no chains are selected, disconnect all current chains
                    if (selectedChains.length === 0) {
                      const allConnectedAddresses = addresses.filter((addr) =>
                        uniqueConnectedChainIds.includes(addr.chainId)
                      );

                      if (allConnectedAddresses.length > 0) {
                        removeAddresses(allConnectedAddresses);

                        // Set flag in localStorage that user has manually disconnected all chains
                        try {
                          const clientState =
                            localStorage.getItem("AdamikClientState") || "{}";
                          const parsedState = JSON.parse(clientState);
                          localStorage.setItem(
                            "AdamikClientState",
                            JSON.stringify({
                              ...parsedState,
                              hasManuallyDisconnected: true,
                            })
                          );
                        } catch (error) {
                          console.error(
                            "Error saving disconnection state:",
                            error
                          );
                        }

                        toast({
                          description: `Disconnected all chains (${allConnectedAddresses.length})`,
                          duration: 2000,
                        });
                      } else {
                        toast({
                          description: "No connected chains to disconnect",
                          duration: 2000,
                        });
                      }
                      return;
                    }

                    // The user has selected specific chains

                    // First disconnect any deselected chains that were previously connected
                    const deselectedConnectedChains =
                      uniqueConnectedChainIds.filter(
                        (chainId) => !selectedChains.includes(chainId)
                      );

                    if (deselectedConnectedChains.length > 0) {
                      // Find the addresses that need to be disconnected
                      const addressesToRemove = addresses.filter((addr) =>
                        deselectedConnectedChains.includes(addr.chainId)
                      );

                      // Remove the addresses for deselected chains
                      if (addressesToRemove.length > 0) {
                        removeAddresses(addressesToRemove);
                        toast({
                          description: `Disconnected ${
                            addressesToRemove.length
                          } chain${addressesToRemove.length > 1 ? "s" : ""}`,
                          duration: 2000,
                        });
                      }
                    }

                    // Connect only the newly selected chains (those not already connected)
                    const chainsToConnect = selectedChains.filter(
                      (chainId) => !uniqueConnectedChainIds.includes(chainId)
                    );

                    if (chainsToConnect.length > 0) {
                      // Important: Only connect the chains that were explicitly selected
                      // Don't use a reference to any other array of chains
                      setConfiguredChains(chainsToConnect);

                      // Immediately connect the selected chains - don't rely on side effects or default chains
                      const validChainsToConnect = chainsToConnect.filter(
                        (chainId) => chains && chains[chainId]
                      );

                      if (validChainsToConnect.length > 0) {
                        // Use a local function to connect just these chains, without relying on the configuredChains state
                        // which might be changed by other effects
                        const connectSelectedChains = async () => {
                          setLoading(true);
                          setError(null);
                          setConnectedCount(0);
                          setSuccessCount(0);
                          setFailedChains([]);

                          // Use a local variable to track successes for the toast
                          let localSuccessCount = 0;
                          let localFailCount = 0;
                          let completedCount = 0;
                          const totalChains = validChainsToConnect.length;

                          // Ensure we have access to the getAddressForChain and addAddresses functions
                          const getAddress = getAddressForChain;
                          const addChainAddresses = addAddresses;

                          // Create a single progress toast that we'll update
                          const progressToast = toast({
                            description: (
                              <div className="flex flex-col gap-2 w-full min-w-[300px]">
                                <div className="flex items-center justify-between w-full">
                                  <span>Connecting chains...</span>
                                  <span className="text-sm text-muted-foreground">
                                    {completedCount}/{totalChains} chains
                                  </span>
                                </div>
                                <CustomProgress
                                  value={(completedCount / totalChains) * 100}
                                />
                              </div>
                            ),
                            duration: Infinity,
                          });

                          // Create array to collect all successful addresses before updating wallet state
                          const allNewAccounts: Account[] = [];

                          // Process each selected chain individually
                          for (const chainId of validChainsToConnect) {
                            try {
                              const result = await getAddress(chainId);

                              // Instead of adding to wallet immediately, collect the address
                              const currentSigner = SignerFactory.getSelectedSignerType();
                              const walletName = currentSigner === SignerType.IOFINNET 
                                ? WalletName.IOFINNET 
                                : currentSigner === SignerType.TURNKEY
                                ? WalletName.TURNKEY
                                : currentSigner === SignerType.BLOCKDAEMON
                                ? WalletName.BLOCKDAEMON
                                : WalletName.SODOT;
                                
                              const account: Account = {
                                address: result.address,
                                chainId: result.chainId,
                                pubKey: result.pubkey,
                                signer: walletName,
                              };

                              // Add to our collection instead of the wallet state
                              allNewAccounts.push(account);

                              localSuccessCount++;

                              // Silently handle the success without a toast for each one
                              console.log(
                                `Successfully connected ${
                                  chains?.[chainId]?.name || chainId
                                }`
                              );
                            } catch (error) {
                              // Still log errors but don't show individual toasts
                              console.error(
                                `Error connecting to ${chainId}:`,
                                error
                              );
                              setFailedChains((prev) => [...prev, chainId]);
                              localFailCount++;
                            } finally {
                              completedCount++;
                              setConnectedCount((prev) => prev + 1);

                              // Update the progress toast
                              progressToast.update({
                                id: progressToast.id,
                                description: (
                                  <div className="flex flex-col gap-2 w-full min-w-[300px]">
                                    <div className="flex items-center justify-between w-full">
                                      <span>Connecting chains...</span>
                                      <span className="text-sm text-muted-foreground">
                                        {completedCount}/{totalChains} chains
                                      </span>
                                    </div>
                                    <CustomProgress
                                      value={
                                        (completedCount / totalChains) * 100
                                      }
                                    />
                                    {localFailCount > 0 && (
                                      <div className="text-sm text-red-500">
                                        {localFailCount} connection failure(s)
                                      </div>
                                    )}
                                  </div>
                                ),
                              });
                            }
                          }

                          // Dismiss the progress toast
                          progressToast.dismiss();

                          // Only after all chains are processed, update the wallet state once
                          if (allNewAccounts.length > 0) {
                            addChainAddresses(allNewAccounts);
                          }

                          // Show the completion toast
                          toast({
                            description: `Connected ${localSuccessCount} chain${
                              localSuccessCount !== 1 ? "s" : ""
                            } successfully${
                              localFailCount > 0
                                ? `, ${localFailCount} failed`
                                : ""
                            }`,
                            duration: 3000,
                          });

                          setLoading(false);
                        };

                        // Start the connection process
                        connectSelectedChains();
                      }
                    } else if (deselectedConnectedChains.length === 0) {
                      // If no chains were connected or disconnected, show a message
                      toast({
                        description: "No changes to connections",
                        duration: 2000,
                      });
                    }
                  }}
                  disabled={
                    selectedChains.length === 0 &&
                    uniqueConnectedChainIds.length === 0
                  }
                >
                  {selectedChains.length === 0
                    ? "Disconnect All Chains"
                    : "Confirm Selection"}
                </Button>
              </div>
              
              {/* Powered by indicator */}
              <div className="flex items-center justify-center gap-2 pt-3 mt-3 border-t">
                <Shield className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Powered by {SIGNER_CONFIGS[SignerFactory.getSelectedSignerType()].displayName}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
