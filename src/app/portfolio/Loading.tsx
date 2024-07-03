import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

type LoadingPorfolioProps = {
  isAddressesLoading: boolean;
  isAssetDetailsLoading: boolean;
  isChainDetailsLoading: boolean;
  isContractAddressPriceLoading: boolean;
};

const Timer = ({ isLoading }: { isLoading: boolean }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLoading) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isLoading && seconds !== 0) {
      clearInterval(interval!);
    }
    return () => clearInterval(interval!);
  }, [isLoading]);

  return <span className="ml-2 text-sm text-gray-500">({seconds}s)</span>;
};

export const Loading = ({
  isAddressesLoading,
  isAssetDetailsLoading,
  isChainDetailsLoading,
  isContractAddressPriceLoading,
}: LoadingPorfolioProps) => {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        Address Data :
        {isAddressesLoading ? (
          <>
            <Loader2 className="animate-spin" />
            <Timer isLoading={isAddressesLoading} />
          </>
        ) : (
          <Check className="text-green-400" />
        )}
      </div>
      <div className="flex items-center">
        Mobula calculate Counter value :
        {isAssetDetailsLoading || isContractAddressPriceLoading ? (
          <>
            <Loader2 className="animate-spin" />
            <Timer
              isLoading={isAssetDetailsLoading || isContractAddressPriceLoading}
            />
          </>
        ) : (
          <Check className="text-green-400" />
        )}
      </div>
      <div className="flex items-center">
        Get ChainDetails :
        {isChainDetailsLoading ? (
          <>
            <Loader2 className="animate-spin" />
            <Timer isLoading={isChainDetailsLoading} />
          </>
        ) : (
          <Check className="text-green-400" />
        )}
      </div>
    </main>
  );
};
