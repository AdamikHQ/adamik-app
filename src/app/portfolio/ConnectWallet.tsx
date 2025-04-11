import { Button } from "~/components/ui/button";
import { useWallet } from "~/hooks/useWallet";

/**
 * ConnectWallet
 * Modal version of wallet connection prompt used in transaction flows
 */
export const ConnectWallet = ({ onNextStep }: { onNextStep: () => void }) => {
  const { setWalletMenuOpen } = useWallet();

  const handleConnect = () => {
    setWalletMenuOpen(true);
    onNextStep();
  };

  return (
    <div>
      <h1 className="font-extrabold text-2xl text-center mb-4">HODL ON!</h1>
      <div className="mb-8 text-center">
        You are currently using the demo version of the Adamik App. <br />
        Please add your wallet before signing transactions.
      </div>
      <Button className="w-full" onClick={handleConnect}>
        Connect Wallet
      </Button>
    </div>
  );
};
