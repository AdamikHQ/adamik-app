import { Button } from "~/components/ui/button";
import { useWallet } from "~/hooks/useWallet";
import { getChains } from "~/api/adamik/chains";
import { getPreferredChains } from "~/config/wallet-chains";
import { encodePubKeyToAddress } from "~/api/adamik/encode";
import { Account, WalletName } from "~/components/wallets/types";
import { useToast } from "~/components/ui/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { SignerFactory } from "~/signers/SignerFactory";
import { SignerType } from "~/signers/types";

/**
 * ConnectWallet
 * Modal version of wallet connection prompt used in transaction flows
 * Uses direct connection without showing the wallet modal
 */
export const ConnectWallet = ({ onNextStep }: { onNextStep: () => void }) => {
  const { addAddresses, setShowroom } = useWallet();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      // Turn off demo mode
      setShowroom(false);

      // Show connecting toast
      toast({
        description: "Connecting wallet...",
        duration: 3000,
      });

      // Fetch chains data
      const chainsData = await getChains();
      if (!chainsData) {
        throw new Error("Failed to load chain information");
      }

      const preferredChains = getPreferredChains(chainsData);
      if (preferredChains.length === 0) {
        throw new Error("No chains configured for connection");
      }

      // Get the selected signer type from settings
      const selectedSigner = SignerFactory.getSelectedSignerType();
      const walletName = selectedSigner === SignerType.IOFINNET 
        ? WalletName.IOFINNET 
        : selectedSigner === SignerType.TURNKEY
        ? WalletName.TURNKEY
        : selectedSigner === SignerType.BLOCKDAEMON
        ? WalletName.BLOCKDAEMON
        : selectedSigner === SignerType.DFNS
        ? WalletName.DFNS
        : WalletName.SODOT;
      
      console.log('[ConnectWallet] Connecting with:', {
        selectedSigner,
        walletName,
        chainsToConnect: preferredChains
      });

      // Connect to all chains in parallel
      const connectionPromises = preferredChains.map(async (chainId) => {
        try {
          // Get chain public key using the selected signer
          const pubkey = await SignerFactory.getChainPubkey(chainId);
          console.log(`[ConnectWallet] Got pubkey for ${chainId}:`, pubkey.substring(0, 20) + '...');

          // Derive address from pubkey
          const { address } = await encodePubKeyToAddress(pubkey, chainId);
          console.log(`[ConnectWallet] Derived address for ${chainId}:`, address);

          // Return account object
          const account = {
            address,
            chainId,
            pubKey: pubkey,
            signer: walletName,
          };
          
          console.log(`[ConnectWallet] Created account for ${chainId}:`, {
            address: address.substring(0, 10) + '...',
            signer: walletName
          });
          
          return {
            success: true,
            account,
          };
        } catch (err) {
          console.error(`Failed to connect to ${chainId}:`, err);
          return {
            success: false,
            chainId,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      });

      // Wait for all connections to complete
      const results = await Promise.all(connectionPromises);

      // Process results
      const successfulAccounts = results
        .filter((result) => result.success)
        .map(
          (result) => (result as { success: true; account: Account }).account
        );

      // Add all successful accounts at once
      if (successfulAccounts.length > 0) {
        addAddresses(successfulAccounts);
      }

      // Count successes and failures
      const successCount = successfulAccounts.length;
      const failedCount = results.length - successCount;

      // Show final result
      toast({
        description: `Connected to ${successCount} chains${
          failedCount > 0 ? `, ${failedCount} failed` : ""
        }`,
        duration: 3000,
      });

      // Proceed to next step
      onNextStep();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        description:
          error instanceof Error ? error.message : "Connection failed",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div>
      <h1 className="font-extrabold text-2xl text-center mb-4">HODL ON!</h1>
      <div className="mb-8 text-center">
        You are currently using the demo version of the Adamik App. <br />
        Please add your wallet before signing transactions.
      </div>
      <Button
        className="w-full"
        onClick={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          "Connect Wallet"
        )}
      </Button>
    </div>
  );
};
