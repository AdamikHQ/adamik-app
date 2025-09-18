import { useMemo } from "react";
import {
  Chain,
  ChainSupportedFeatures,
  AdamikCurve,
  AdamikHashFunction,
} from "~/utils/types";
import { useFilteredChains } from "./useChains";

// Create a basic structure for the Stellar chain
const stellarChain: Chain = {
  family: "stellar",
  id: "stellar",
  nativeId: "stellar",
  name: "Stellar",
  ticker: "XLM",
  decimals: 7,
  params: {},
  // Create a minimal supported features object
  supportedFeatures: {
    read: {
      token: false,
      validators: false,
      transaction: {
        native: false,
        tokens: false,
        staking: false,
      },
      account: {
        balances: {
          native: false,
          tokens: false,
          staking: false,
        },
        transactions: {
          native: false,
          tokens: false,
          staking: false,
        },
      },
    },
    write: {
      transaction: {
        type: {
          deployAccount: false,
          transfer: false,
          transferToken: false,
          enableToken: false,
          stake: false,
          unstake: false,
          claimRewards: false,
          withdraw: false,
          registerStake: false,
        },
        field: {
          memo: false,
        },
      },
    },
    utils: {
      addresses: false,
    },
  },
  signerSpec: {
    curve: AdamikCurve.ED25519,
    hashFunction: AdamikHashFunction.SHA256,
    signatureFormat: "raw",
    coinType: "148",
  },
};

// Custom property to mark the chain as coming soon
export interface ExtendedChain extends Chain {
  comingSoon?: boolean;
  logo?: string;
}

export const useExtendedChains = () => {
  const chainsQuery = useFilteredChains();

  const extendedData = useMemo(() => {
    if (!chainsQuery.data) return null;

    // Create a copy of the chains data
    const newChains: Record<string, ExtendedChain> = { ...chainsQuery.data };

    // Add Stellar with comingSoon flag
    newChains.stellar = {
      ...stellarChain,
      comingSoon: true,
    };

    return newChains;
  }, [chainsQuery.data]);

  return {
    ...chainsQuery,
    data: extendedData,
  };
};
