"use server";
import { ADAMIK_API_URL, env } from "~/env";
import { Status, Transaction, TransactionData } from "~/utils/types";

export const transactionEncode = async (
  transactionData: TransactionData
): Promise<{
  chainId: string;
  transaction: Transaction;
  status: Status;
  // TODO Better API error management, consistent for all endpoints
}> => {
  const response = await fetch(
    `${ADAMIK_API_URL}/${transactionData.chainId}/transaction/encode`,
    {
      headers: {
        Authorization: env.ADAMIK_API_KEY,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ transaction: { data: transactionData } }),
    }
  );

  if (!response.ok) {
    const error = (await response.json()) as {
      status: { errors: { message: string }[] };
    };

    if (error.status.errors.length > 0) {
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${error.status.errors[0].message}`
      );
    }
  }

  const result = (await response.json()) as {
    chainId: string;
    transaction: Transaction;
    status: Status;
  };
  return result;
};

export const encodePubKeyToAddress = async (
  pubKey: string,
  chainId: string
) => {
  try {
    const response = await fetch(
      `${ADAMIK_API_URL}/${chainId}/address/encode`,
      {
        method: "POST",
        headers: {
          Authorization: env.ADAMIK_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pubkey: pubKey,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Adamik API error for ${chainId}:`, errorText);
      console.error(`Failed pubkey: ${pubKey}`);
      console.error(`Pubkey length: ${pubKey.length}, starts with: ${pubKey.substring(0, 10)}`);
      throw new Error(`API request failed with status ${response.status} for chain ${chainId}`);
    }

    const result = (await response.json()) as {
      status?: {
        errors: Array<{ message: string }>;
      };
      addresses?: Array<{
        address: string;
        type: string;
      }>;
    };

    if (
      result.status &&
      result.status.errors &&
      result.status.errors.length > 0
    ) {
      throw new Error(result.status.errors[0].message);
    }

    const addresses = result.addresses;

    if (!addresses || addresses.length === 0) {
      throw new Error("No addresses found for the given public key");
    }

    // For Bitcoin chains, select p2wpkh address type (SegWit)
    if (chainId === "bitcoin" || chainId === "bitcoin-testnet") {
      const p2wpkhAddress = addresses.find(addr => 
        addr.type === "p2wpkh" || addr.type === "P2WPKH"
      );
      
      if (p2wpkhAddress) {
        return {
          address: p2wpkhAddress.address,
          type: p2wpkhAddress.type,
          allAddresses: addresses,
        };
      }
      
      // Fallback to p2pkh if p2wpkh not found
      const p2pkhAddress = addresses.find(addr => 
        addr.type === "p2pkh" || addr.type === "P2PKH"
      );
      
      if (p2pkhAddress) {
        return {
          address: p2pkhAddress.address,
          type: p2pkhAddress.type,
          allAddresses: addresses,
        };
      }
      
      // Fallback to first address if neither found
    }

    // For other chains, use the first address
    // This is typically the most common/default address format for the chain
    return {
      address: addresses[0].address,
      type: addresses[0].type,
      allAddresses: addresses,
    };
  } catch (error) {
    console.error(`Error encoding pubkey to address:`, error);
    throw error;
  }
};
