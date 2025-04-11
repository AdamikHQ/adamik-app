import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import { useWallet } from "~/hooks/useWallet";
import { Button } from "../ui/button";
import { getChains } from "~/api/adamik/chains";
import { getPreferredChains } from "~/config/wallet-chains";
import { encodePubKeyToAddress } from "~/api/adamik/encode";
import { Account, WalletName } from "../wallets/types";
import { useToast } from "~/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export const WelcomeModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { setShowroom, addAddresses } = useWallet();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setIsModalOpen(true);
  }, []);

  // Direct connection function that bypasses the modal entirely
  const connectWalletDirectly = async () => {
    setIsConnecting(true);

    try {
      // Close the welcome modal immediately
      setIsModalOpen(false);

      // Show a toast to indicate connection is in progress
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

      // Connect to all chains
      let successCount = 0;
      let failedCount = 0;

      // Process each chain
      for (const chainId of preferredChains) {
        try {
          // Get chain public key
          const pubkeyResponse = await fetch(
            `/api/sodot-proxy/derive-chain-pubkey?chain=${chainId}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          if (!pubkeyResponse.ok) {
            throw new Error(`Failed to get pubkey for ${chainId}`);
          }

          const pubkeyData = await pubkeyResponse.json();
          const pubkey = pubkeyData.data.pubkey;

          // Derive address from pubkey
          const { address } = await encodePubKeyToAddress(pubkey, chainId);

          // Create and add account
          const account: Account = {
            address,
            chainId,
            pubKey: pubkey,
            signer: WalletName.SODOT,
          };

          addAddresses([account]);
          successCount++;
        } catch (err) {
          console.error(`Failed to connect to ${chainId}:`, err);
          failedCount++;
        }
      }

      // Show final result
      toast({
        description: `Connected to ${successCount} chains${
          failedCount > 0 ? `, ${failedCount} failed` : ""
        }`,
        duration: 3000,
      });
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

  const handleShowroomMode = (isShowroom: boolean) => {
    // Set showroom mode based on user selection
    setShowroom(isShowroom);

    // If using showroom mode, close modal immediately
    if (isShowroom) {
      setIsModalOpen(false);
    } else {
      // If not using showroom mode, directly connect wallet
      connectWalletDirectly();
    }
  };

  const handleNextStep = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  return (
    <Modal
      open={isModalOpen}
      displayCloseButton={false}
      modalContent={
        <div className="flex items-center flex-col gap-4">
          {currentStep === 1 && (
            <>
              <h1 className="text-2xl font-semibold text-center">
                Welcome to the Adamik App!
              </h1>
              <div className="flex flex-col gap-2 text-center text-sm text-gray-400">
                <p>
                  Adamik is an open source multichain application powered by the{" "}
                  <a
                    href="https://docs.adamik.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Adamik API
                  </a>
                </p>
                <div className="h-4"></div> {/* Extra space */}
                <img
                  src="/intro.png"
                  alt="Adamik Introduction"
                  className="w-[80%] h-auto mx-auto"
                />
              </div>
              <div className="w-full flex justify-end mt-6 pr-4">
                <Button onClick={handleNextStep}>Next</Button>
              </div>
            </>
          )}
          {currentStep === 2 && (
            <>
              <div className="w-full flex justify-start pl-4">
                <button
                  className="text-sm text-gray-400 hover:text-gray-600"
                  onClick={handlePreviousStep}
                >
                  <span className="mr-1">{"<"}</span>Go Back
                </button>
              </div>
              <h1 className="text-2xl font-semibold text-center">
                Use in Demo mode or Add your Wallet
              </h1>
              <div className="flex flex-col gap-2 text-center text-sm text-gray-400">
                <p>Easily switch between modes using the toggle</p>
                <video
                  className="w-1/4 h-auto mt-4 rounded-lg mx-auto"
                  src="/toggle.mp4"
                  autoPlay
                  loop
                  muted
                />
              </div>
              <div className="flex justify-center gap-4 w-full mt-6">
                <Button
                  className="w-48"
                  onClick={() => handleShowroomMode(true)}
                >
                  Enter Demo
                </Button>
                <Button
                  className="w-48"
                  onClick={() => handleShowroomMode(false)}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Add Wallet"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
