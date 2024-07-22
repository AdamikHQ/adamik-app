import { useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { FireBlocksModal } from "./FireBlocksModal";
import { useToast } from "~/components/ui/use-toast";
import { WalletConnectorProps, WalletName } from "./types";
import { useWallet } from "~/hooks/useWallet";
import { useTransaction } from "~/hooks/useTransaction";
import { Modal } from "../../components/ui/modal";
import { Loader2 } from "lucide-react";

export const FireBlocksConnect: React.FC<WalletConnectorProps> = ({
  transactionPayload,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const { toast } = useToast();
  const { addAddresses } = useWallet();
  const { setSignedTransaction } = useTransaction();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const closeValidationModal = () => setIsValidationModalOpen(false);

  const handleConnect = useCallback(
    (data: { address: string; pubKey: string; chainId: string }) => {
      addAddresses([
        {
          address: data.address,
          pubKey: data.pubKey,
          chainId: data.chainId,
          signer: WalletName.FIREBLOCKS,
        },
      ]);

      toast({
        description:
          "Connected to Fireblocks, please check portfolio page to see your assets",
      });
    },
    [addAddresses, toast]
  );

  const sign = useCallback(async () => {
    if (!transactionPayload) {
      return;
    }

    try {
      setIsValidationModalOpen(true);

      // Wait for 5 seconds to simulate user validation
      await new Promise((resolve) => setTimeout(resolve, 5000));
      closeValidationModal();

      // Mocking the signing process

      toast({
        description: "Transaction signed successfully",
      });
    } catch (e) {
      toast({
        description: "Transaction signing failed",
        variant: "destructive",
      });
      throw e;
    }
  }, [setSignedTransaction, toast, transactionPayload]);

  return (
    <>
      <div
        className="relative w-24 h-24"
        onClick={transactionPayload ? sign : openModal}
      >
        <Avatar className="cursor-pointer w-24 h-24">
          <AvatarImage
            src="/wallets/FireBlocks.png"
            alt="FireBlocks Wallet Connector"
          />
          <AvatarFallback>FireBlocks</AvatarFallback>
        </Avatar>
      </div>
      <FireBlocksModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConnect={handleConnect}
      />
      <Modal
        open={isValidationModalOpen}
        onClose={closeValidationModal}
        modalContent={
          <div className="flex items-center flex-col gap-4">
            <Loader2 className="animate-spin" height={32} width={32} />
            <h1 className="text-2xl font-semibold text-center">
              Validate Transaction
            </h1>
            <p className="text-center text-sm text-gray-400">
              Please validate the transaction on your Fireblocks interface.
            </p>
          </div>
        }
      />
    </>
  );
};
