import { useCallback, useMemo } from "react";
import { WalletConnectorProps } from "./types";
import { useChains } from "~/hooks/useChains";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

/**
 * Ethers signer - FOR TESTING ONLY
 */
export const EthersConnect: React.FC<WalletConnectorProps> = ({
  chainId,
  transactionPayload,
}) => {
  /*
  const { sdk } = useSDK();
  const { toast } = useToast();
  const { setTransactionHash } = useTransaction();
  const { addAddresses } = useWallet();
  */

  const { data: chains } = useChains();

  const evmChains = useMemo(
    () =>
      chains && Object.values(chains).filter((chain) => chain.family === "evm"),
    [chains]
  );

  const evmChainIds = useMemo(
    () => evmChains && evmChains.map((chain) => chain.id),
    [evmChains]
  );

  const getAddresses = useCallback(async () => {
    // TODO
  }, []);

  const sign = useCallback(async () => {
    // TODO
  }, []);

  return (
    <div className="relative w-24 h-24">
      <Avatar
        className="cursor-pointer w-24 h-24"
        onClick={transactionPayload ? () => sign() : () => getAddresses()}
      >
        <AvatarImage src={"/wallets/Ethers.svg"} alt={"ethers"} />
        <AvatarFallback>Ethers (TESTING ONLY)</AvatarFallback>
      </Avatar>
    </div>
  );
};
