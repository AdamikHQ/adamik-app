import { Button } from "~/components/ui/button";

export const ConnectWallet = () => {
  return (
    <div className="p-4">
      <div className="pb-8">
        You are in the Adamik showroom. Please add your wallet to sign
        transactions
      </div>
      <Button className="w-full">Add your wallet</Button>
    </div>
  );
};
