import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  HandshakeIcon,
  LogOut,
  HandCoins,
  HelpCircle,
  Search,
  Send,
} from "lucide-react";
import { ParsedTransaction } from "~/utils/types";

const getTransactionTypeIcon = (mode: string) => {
  switch (mode) {
    case "transferToken":
    case "transfer":
      return <Send className="w-4 h-4" />;
    case "delegate":
      return <HandshakeIcon className="w-4 h-4" />;
    case "undelegate":
      return <LogOut className="w-4 h-4" />;
    case "claimRewards":
      return <HandCoins className="w-4 h-4" />;
    default:
      return <HelpCircle className="w-4 h-4" />;
  }
};

interface ParsedTransactionProps {
  tx: ParsedTransaction;
  selectedAccountChainId?: string;
  formattedTransactions: Record<
    string,
    {
      formattedAmount: string;
      formattedFee: string;
    }
  >;
  isFormattingAmounts: boolean;
}

export function ParsedTransactionComponent({
  tx,
  selectedAccountChainId,
  formattedTransactions,
  isFormattingAmounts,
}: ParsedTransactionProps) {
  const { parsed } = tx;
  const formatted = formattedTransactions[parsed.id] || {
    formattedAmount: "",
    formattedFee: "",
  };

  return (
    <div className="p-3 sm:p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getTransactionTypeIcon(parsed.mode)}</span>
          <span className="capitalize font-medium">{parsed.mode}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              parsed.state === "confirmed"
                ? "bg-green-900/50 text-green-300"
                : "bg-red-900/50 text-red-300"
            }`}
          >
            {parsed.state}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(Number(parsed.timestamp)), {
              addSuffix: true,
            })}
          </span>
          <Link
            href={`/data?chainId=${selectedAccountChainId}&transactionId=${parsed.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {parsed.senders && parsed.recipients && (
        <div className="space-y-2 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground w-16">From:</span>
            <span className="font-mono break-all">
              <span className="sm:hidden">
                {`${parsed.senders[0].address.slice(
                  0,
                  6
                )}...${parsed.senders[0].address.slice(-4)}`}
              </span>
              <span className="hidden sm:inline">
                {parsed.senders[0].address}
              </span>
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground w-16">To:</span>
            <span className="font-mono break-all">
              <span className="sm:hidden">
                {`${parsed.recipients[0].address.slice(
                  0,
                  6
                )}...${parsed.recipients[0].address.slice(-4)}`}
              </span>
              <span className="hidden sm:inline">
                {parsed.recipients[0].address}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16">
              {parsed.mode === "claimRewards" ? "Claimed:" : "Amount:"}
            </span>
            {isFormattingAmounts ? (
              <div className="h-5 w-24 animate-pulse bg-accent/50 rounded" />
            ) : (
              <span className="font-medium">{formatted.formattedAmount}</span>
            )}
          </div>
        </div>
      )}

      {parsed.validators && (
        <div className="space-y-2 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground w-16">Validator:</span>
            <span className="font-mono break-all">
              <span className="sm:hidden">
                {`${parsed.validators.target.address.slice(
                  0,
                  6
                )}...${parsed.validators.target.address.slice(-4)}`}
              </span>
              <span className="hidden sm:inline">
                {parsed.validators.target.address}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16">Amount:</span>
            <span className="font-medium">
              {isFormattingAmounts ? (
                <div className="inline-block h-4 w-16 animate-pulse bg-accent/50 rounded" />
              ) : (
                formatted.formattedAmount
              )}
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 text-sm text-muted-foreground">
        Fee:{" "}
        {isFormattingAmounts ? (
          <div className="inline-block h-4 w-16 animate-pulse bg-accent/50 rounded" />
        ) : (
          formatted.formattedFee
        )}
      </div>
    </div>
  );
}
