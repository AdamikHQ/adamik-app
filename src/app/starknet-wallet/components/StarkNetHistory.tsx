"use client";

import { Loader2 } from "lucide-react";
import { AccountHistoryResponse } from "~/api/adamik/history";
import { FinalizedTransaction } from "~/utils/types";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { ParsedTransactionComponent } from "~/components/transactions/ParsedTransaction";

interface StarkNetHistoryProps {
  address: string | undefined;
  historyData: AccountHistoryResponse | null | undefined;
  isLoading: boolean;
  error: Error | null;
  formattedTransactions: Record<
    string,
    { formattedAmount: string; formattedFee: string }
  >;
  isFormattingAmounts: boolean;
}

export const StarkNetHistory = ({
  address,
  historyData,
  isLoading,
  error,
  formattedTransactions,
  isFormattingAmounts,
}: StarkNetHistoryProps) => {
  // 1. Handle Loading State (Combined initial load and formatting load)
  if (isLoading || (historyData && isFormattingAmounts)) {
    return (
      <Card className="min-h-[200px]">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">
            {isLoading ? "Loading history..." : "Formatting amounts..."}
          </span>
        </CardContent>
      </Card>
    );
  }

  // 2. Handle Error State
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">
            Error Fetching History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-2 text-sm">
            Could not load transaction history for address: {address || "N/A"}
          </p>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
            {error.message}
          </pre>
        </CardContent>
      </Card>
    );
  }

  // 3. Handle Success State (including no data)
  const transactions = historyData?.transactions?.filter((tx) => !!tx.parsed);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        {transactions && (
          <span className="text-sm text-muted-foreground pt-1">
            ({transactions.length} operations)
          </span>
        )}
      </CardHeader>
      <CardContent>
        {transactions && transactions.length > 0 ? (
          <div className="space-y-4 px-1 max-h-[400px] overflow-y-auto">
            {transactions.map((tx: FinalizedTransaction) => (
              <ParsedTransactionComponent
                key={tx.parsed!.id}
                tx={tx.parsed!}
                selectedAccountChainId={historyData?.chainId}
                formattedTransactions={formattedTransactions}
                isFormattingAmounts={isFormattingAmounts}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic text-sm py-4">
            No transaction history found for this address.
          </p>
        )}
        {/* TODO: Add pagination controls if historyData.pagination.nextPage exists */}
      </CardContent>
    </Card>
  );
};
