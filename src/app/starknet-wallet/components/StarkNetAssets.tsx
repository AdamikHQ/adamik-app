"use client";

import { useAccount } from "@starknet-react/core";
import { useAccountStateBatch } from "~/hooks/useAccountStateBatch";
import { Loader2 } from "lucide-react";
import { AccountState, TokenAmount } from "~/utils/types";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";

// Use "starknet" as the chain ID for Adamik API
const STARKNET_CHAIN_ID = "starknet";

// Helper to safely format balance using BigInt and number formatting
const formatBalance = (value: string | undefined, decimals: number): string => {
  if (typeof value !== "string" || !value) {
    return "0.0";
  }
  try {
    const valueBigInt = BigInt(value);
    const divisor = BigInt(10 ** decimals);
    const integerPart = valueBigInt / divisor;
    const fractionalPart = valueBigInt % divisor;

    if (fractionalPart === 0n) {
      return integerPart.toString();
    }

    // Pad fractional part with leading zeros if needed
    const fractionalString = fractionalPart.toString().padStart(decimals, "0");
    // Remove trailing zeros, leave at least one digit if not zero
    const trimmedFractional = fractionalString.replace(/0+$/, "");
    // Limit to a reasonable number of decimal places (e.g., 6)
    const finalFractional = trimmedFractional.substring(0, 6) || "0";

    const formattedNumber = parseFloat(`${integerPart}.${finalFractional}`);
    return formattedNumber.toLocaleString(undefined, {
      maximumFractionDigits: 6,
    });
  } catch (error) {
    console.error("Error formatting balance:", value, error);
    return "Error";
  }
};

// Add nativeDecimals and nativeTicker to props
interface StarkNetAssetsProps {
  nativeDecimals: number | undefined;
  nativeTicker: string | undefined;
}

export const StarkNetAssets = ({
  nativeDecimals,
  nativeTicker,
}: StarkNetAssetsProps) => {
  const { address, isConnected } = useAccount();

  const accountStateParams =
    isConnected && address ? [{ chainId: STARKNET_CHAIN_ID, address }] : [];

  const {
    data: addressesData, // Type is (AccountState | null | undefined)[] based on useQueries
    isLoading: isAddressesLoading,
    error: addressesError,
  } = useAccountStateBatch(accountStateParams);

  const hasActualError =
    addressesError && addressesError.some((error) => error !== null);
  const actualErrors = hasActualError
    ? addressesError.filter((error) => error !== null)
    : [];

  // 1. Handle Not Connected State
  if (!isConnected || !address) {
    return (
      <Card className="min-h-[150px]">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground pt-4">
            Please connect your StarkNet wallet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 2. Handle Loading State or Missing Decimals/Ticker
  if (
    isAddressesLoading ||
    typeof nativeDecimals === "undefined" ||
    typeof nativeTicker === "undefined"
  ) {
    return (
      <Card className="min-h-[150px]">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading account data...</span>
        </CardContent>
      </Card>
    );
  }

  // 3. Handle Error State
  if (hasActualError) {
    return (
      <Card className="min-h-[150px]">
        <CardHeader>
          <CardTitle className="text-destructive">Overview - Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-2 text-sm">
            Could not load account state for address: {address}
          </p>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
            {JSON.stringify(actualErrors, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  }

  // 4. Handle Success State
  // Safely get the account data, handling potential undefined from useQueries during loading transitions
  const accountData: AccountState | null =
    addressesData && addressesData.length > 0 && addressesData[0] !== undefined
      ? addressesData[0]
      : null;

  return (
    <Card className="min-h-[150px]">
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {accountData ? (
          <div className="pt-2">
            <h4 className="text-md font-medium mb-2">Balances:</h4>
            <div className="space-y-2">
              {/* Native Balance - Use nativeTicker prop */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Native ({nativeTicker || "Currency"}):
                </span>
                <span className="text-sm font-medium">
                  {formatBalance(
                    accountData.balances?.native?.available,
                    nativeDecimals
                  )}
                </span>
              </div>

              {/* Token Balances */}
              {accountData.balances?.tokens &&
              accountData.balances.tokens.length > 0 ? (
                accountData.balances.tokens.map((tokenAmount: TokenAmount) => (
                  // Use token contractAddress for key if available, otherwise token name/ticker
                  <div
                    key={
                      tokenAmount.token?.contractAddress ||
                      tokenAmount.token?.name ||
                      tokenAmount.token?.ticker
                    }
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-muted-foreground">
                      {tokenAmount.token?.name || "Unknown Token"} (
                      {tokenAmount.token?.ticker || "?"})
                    </span>
                    <span className="text-sm font-medium">
                      {formatBalance(
                        tokenAmount.amount,
                        tokenAmount.token?.decimals || 0
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No token balances found.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground italic pt-4">
            No account data available from API.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
