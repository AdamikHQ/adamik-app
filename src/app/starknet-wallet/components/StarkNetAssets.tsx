"use client";

import { useAccount } from "@starknet-react/core";
import { Loader2 } from "lucide-react";
import { AccountState, TokenAmount, Token } from "~/utils/types";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { resolveLogo, formatAmountUSD, amountToMainUnit } from "~/utils/helper";
import { MobulaMarketMultiDataResponse } from "~/api/mobula/marketMultiData";
import { MobulaBlockchain } from "~/api/mobula/types";
import { Button } from "~/components/ui/button";

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

// Updated Props Interface
interface StarkNetAssetsProps {
  isLoading: boolean; // Combined loading state from parent
  accountData: AccountState | null | undefined; // Account data passed from parent
  error: (Error | null)[] | null; // Error object passed from parent
  nativeDecimals: number | undefined;
  nativeTicker: string | undefined;
  mobulaMarketData: MobulaMarketMultiDataResponse | null | undefined; // Market data
  mobulaBlockchainDetails: MobulaBlockchain[] | undefined; // Blockchain details for logos
  handleOpenTransaction: (isOpen: boolean) => void;
}

export const StarkNetAssets = ({
  isLoading,
  accountData,
  error: addressesError, // Rename prop for clarity
  nativeDecimals,
  nativeTicker,
  mobulaMarketData,
  mobulaBlockchainDetails,
  handleOpenTransaction,
}: StarkNetAssetsProps) => {
  const { address, isConnected } = useAccount(); // Still need this for display/checks

  const hasActualError =
    addressesError && addressesError.some((err) => err !== null);
  const actualErrors = hasActualError
    ? addressesError.filter((err) => err !== null)
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

  // 2. Handle Loading State (simplified - uses parent isLoading)
  if (
    isLoading ||
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

  // 3. Handle Error State (uses parent error)
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
  const nativeBalance = accountData?.balances?.native?.available;
  const tokenBalances = accountData?.balances?.tokens || [];
  const hasNativeBalance = typeof nativeBalance === "string";
  const hasTokens = tokenBalances.length > 0;

  // --- Calculate Native USD Value & Logo ---
  const nativeBalanceMainUnit = hasNativeBalance
    ? amountToMainUnit(nativeBalance, nativeDecimals)
    : null;
  const nativeMarketInfo =
    mobulaMarketData && nativeTicker ? mobulaMarketData[nativeTicker] : null;
  const nativeBalanceUSD =
    nativeMarketInfo && nativeBalanceMainUnit
      ? nativeMarketInfo.price * parseFloat(nativeBalanceMainUnit)
      : undefined;
  const nativeLogo = resolveLogo({
    asset: { name: nativeTicker || "StarkNet", ticker: nativeTicker || "" },
    mobulaMarketData,
    mobulaBlockChainData: mobulaBlockchainDetails,
  });
  // --- End Calculation ---

  // Determine if there are any assets to transfer
  const canTransfer = hasNativeBalance || hasTokens;

  return (
    <Card className="min-h-[150px]">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Overview</CardTitle>
        <Button
          onClick={() => handleOpenTransaction(true)}
          disabled={!canTransfer || !accountData}
          size="sm"
        >
          Transfer
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {accountData ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Value (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Native Balance Row */}
              {hasNativeBalance ? (
                <TableRow>
                  <TableCell>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={nativeLogo} alt={nativeTicker} />
                      <AvatarFallback>
                        {nativeTicker?.substring(0, 2) || "N"}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    {nativeTicker || "Native Currency"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatBalance(nativeBalance!, nativeDecimals)}
                  </TableCell>
                  <TableCell className="text-right">
                    {nativeBalanceUSD !== undefined
                      ? formatAmountUSD(nativeBalanceUSD)
                      : "-"}
                  </TableCell>
                </TableRow>
              ) : null}
              {/* Token Balance Rows */}
              {hasTokens
                ? tokenBalances.map((tokenAmount: TokenAmount) => {
                    // --- Calculate Token USD Value & Logo ---
                    const token = tokenAmount.token;
                    const tokenBalanceMainUnit = amountToMainUnit(
                      tokenAmount.amount,
                      token.decimals
                    );
                    const tokenIndex = token.contractAddress ?? token.ticker;
                    const tokenMarketInfo =
                      mobulaMarketData && tokenIndex
                        ? mobulaMarketData[tokenIndex]
                        : null;
                    const tokenBalanceUSD =
                      tokenMarketInfo && tokenBalanceMainUnit
                        ? tokenMarketInfo.price *
                          parseFloat(tokenBalanceMainUnit)
                        : undefined;
                    const tokenLogo = resolveLogo({
                      asset: { name: token.name || "", ticker: tokenIndex },
                      mobulaMarketData,
                      mobulaBlockChainData: mobulaBlockchainDetails,
                    });
                    // --- End Calculation ---

                    return (
                      <TableRow
                        key={
                          token.contractAddress || token.name || token.ticker
                        }
                      >
                        <TableCell>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={tokenLogo} alt={token.name} />
                            <AvatarFallback>
                              {token.ticker?.substring(0, 2) || "T"}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                          {token.name || "Unknown Token"}
                          <span className="text-muted-foreground ml-1">
                            ({token.ticker || "?"})
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatBalance(
                            tokenAmount.amount,
                            token.decimals || 0
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {tokenBalanceUSD !== undefined
                            ? formatAmountUSD(tokenBalanceUSD)
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                : null}
              {/* Message if no balances found at all */}
              {!hasNativeBalance && !hasTokens ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground italic py-4"
                  >
                    No balances found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        ) : (
          // Message if API returned no data for the account
          <p className="text-muted-foreground italic pt-4">
            No account data available from API.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
