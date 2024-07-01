import { Button } from "~/components/ui/button";

export const ConnectWallet = ({ onNextStep }: { onNextStep: () => void }) => {
  return (
    <div>
      <h1 className="font-extrabold text-2xl text-center mb-4">HODL ON !</h1>
      <div className="mb-8 text-center">
        You are currently using the demo version of the Adamik App. Please add
        your wallet before signing transactions.
      </div>
      <Button className="w-full" onClick={() => onNextStep()}>
        Add your wallet
      </Button>
    </div>
  );
};
