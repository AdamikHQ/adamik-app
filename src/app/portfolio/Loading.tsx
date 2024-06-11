import { Check, Loader2 } from "lucide-react";

type LoadingPorfolioProps = {
  isAddressesLoading: boolean;
  isSimplePriceLoading: boolean;
  isChainDetailsLoading: boolean;
};

export const Loading = ({
  isAddressesLoading,
  isSimplePriceLoading,
  isChainDetailsLoading,
}: LoadingPorfolioProps) => {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        Address Data :
        {isAddressesLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Check className="text-green-400" />
        )}
      </div>
      <div className="flex items-center">
        Coin Gecko Counter value :
        {isSimplePriceLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Check className="text-green-400" />
        )}
      </div>
      <div className="flex items-center">
        Get ChainDetails :
        {isChainDetailsLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Check className="text-green-400" />
        )}
      </div>
    </main>
  );
};
