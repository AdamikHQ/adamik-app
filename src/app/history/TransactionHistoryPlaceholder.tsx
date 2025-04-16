import { Loader2, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Chain } from "~/utils/types";

// Import types from the wallet
type Account = {
  address: string;
  chainId: string;
  pubKey?: string;
  signer?: string;
};

// Helper function to format addresses with ellipsis
const formatAddress = (address: string, prefixLength = 6, suffixLength = 4) => {
  if (!address || address.length <= prefixLength + suffixLength) {
    return address;
  }
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
};

// Function to generate a consistent background color based on chain ID
const getChainColor = (chainId: string): string => {
  // Common blockchain families and their associated colors
  const chainColors: Record<string, string> = {
    // EVM chains - blue family
    ethereum: "bg-blue-500",
    optimism: "bg-red-500",
    arbitrum: "bg-blue-400",
    polygon: "bg-purple-500",
    base: "bg-blue-600",
    avalanche: "bg-red-600",

    // Cosmos chains - purple family
    cosmoshub: "bg-indigo-500",
    osmosis: "bg-purple-600",
    dydx: "bg-violet-500",

    // Other major chains
    bitcoin: "bg-amber-500",
    solana: "bg-gradient-to-r from-purple-600 to-green-500",
    ton: "bg-sky-500",
    near: "bg-gray-800",
    tron: "bg-red-500",
  };

  // Extract the main part of the chain ID (before any hyphens)
  const mainChainId = chainId.split("-")[0].toLowerCase();

  // Return predefined color or a fallback based on first character
  return chainColors[mainChainId] || "bg-slate-600";
};

interface AccountRowProps {
  account: Account;
  chain?: Chain;
}

const AccountRow: React.FC<AccountRowProps> = ({ account, chain }) => {
  // Get first letters of chainId for display when no logo exists
  const chainAbbreviation = account.chainId
    .split("-")[0] // Handle hyphenated chainIds
    .substring(0, 2)
    .toUpperCase();

  // TODO replace with logo fetched from Adamik chain endpoint when available
  const chainColor = getChainColor(account.chainId);

  return (
    <TableRow className="hover:bg-secondary/30">
      <TableCell>
        <Avatar className="w-[38px] h-[38px]">
          {/* Chain logos are not directly accessible from the Chain type */}
          <AvatarFallback className={`${chainColor} text-white`}>
            {chainAbbreviation}
          </AvatarFallback>
        </Avatar>
      </TableCell>
      <TableCell className="flex justify-between items-center">
        <span>{formatAddress(account.address, 12, 6)}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </TableCell>
    </TableRow>
  );
};

export const TransactionHistoryPlaceholder: React.FC<{
  accounts: Account[];
  chains?: Record<string, Chain> | null;
  isMobileView?: boolean;
}> = ({ accounts, chains, isMobileView = false }) => {
  // Filter accounts that might support transaction history
  const filteredAccounts = accounts.filter((account) => {
    const chain = chains?.[account.chainId];

    // If we have chain data, only show chains with transaction history support
    if (chain) {
      return chain.supportedFeatures?.read?.account?.transactions?.native;
    }

    // If we don't have chain data yet, make an educated guess based on chain family
    // Most EVM chains and Cosmos chains support transaction history
    const chainId = account.chainId.toLowerCase();

    // Common chains with history support
    const likelySupported = [
      "ethereum",
      "arbitrum",
      "optimism",
      "base",
      "polygon",
      "avalanche",
      "cosmoshub",
      "osmosis",
      "dydx",
      "stargaze",
      "juno",
    ];

    // Check if this chain is likely to support history
    return likelySupported.some((chain) => chainId.includes(chain));
  });

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {(!isMobileView || (isMobileView && true)) && (
        <Card className="w-full lg:w-1/2">
          <CardHeader>
            <CardTitle>Available Accounts</CardTitle>
          </CardHeader>
          <CardContent className="content">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]"></TableHead>
                  <TableHead>
                    <span className="hidden sm:inline">Address</span>
                    <span className="sm:hidden">Addr.</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => {
                    const chain = chains?.[account.chainId];
                    return (
                      <AccountRow
                        key={`${account.chainId}-${account.address}`}
                        account={account}
                        chain={chain}
                      />
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        No accounts found with transaction history support.
                        Please connect a wallet with supported chains.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(!isMobileView || (isMobileView && false)) && (
        <Card className="w-full lg:w-1/2">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 text-sm text-muted-foreground">
              <p>Select an account to view its transaction history.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
