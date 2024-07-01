import { Button } from "~/components/ui/button";

export const ConnectWallet = ({ onNextStep }: { onNextStep: () => void }) => {
  return (
    <div>
      <h1 className="font-extrabold text-2xl text-center mb-4">HODL ON !</h1>
      <div className="mb-8 text-center">
        You are in the Adamik showroom. Please add your wallet to sign
        transactions
      </div>
      <Button className="w-full" onClick={() => onNextStep()}>
        Add your wallet
      </Button>
    </div>
  );
};
