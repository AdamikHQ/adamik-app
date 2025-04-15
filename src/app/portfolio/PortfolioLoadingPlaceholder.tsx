import { Loader2 } from "lucide-react";
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
import { SupportedBlockchain } from "~/utils/types";

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

interface ChainPlaceholderProps {
  address: Account;
  chain?: SupportedBlockchain;
}

const ChainPlaceholderRow: React.FC<ChainPlaceholderProps> = ({
  address,
  chain,
}) => {
  // Get first letters of chainId for display when no logo exists
  const chainAbbreviation = address.chainId
    .split("-")[0] // Handle hyphenated chainIds
    .substring(0, 2)
    .toUpperCase();

  // TODO replace with logo fetched from Adamik chain endpoint when available
  const chainColor = getChainColor(address.chainId);

  return (
    <TableRow className="hover:bg-secondary/30">
      <TableCell>
        <div className="relative">
          <Avatar className="w-[38px] h-[38px]">
            {chain?.logo ? (
              <AvatarImage src={chain.logo} alt={chain.name} />
            ) : (
              <AvatarFallback className={`${chainColor} text-white`}>
                {chainAbbreviation}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span>{address.chainId}</span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {formatAddress(address.address, 8, 8)}
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      </TableCell>
    </TableRow>
  );
};

export const PortfolioLoadingPlaceholder: React.FC<{
  addresses: Account[];
  chains?: Record<string, SupportedBlockchain> | null;
}> = ({ addresses, chains }) => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">$</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Loader2 className="animate-spin" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Balance
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">$</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Loader2 className="animate-spin" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Staked Balance
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">$</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Loader2 className="animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]"></TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Address
                  </TableHead>
                  <TableHead>Amount (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.length > 0 ? (
                  addresses.map((address) => {
                    const chain = chains?.[address.chainId];
                    return (
                      <ChainPlaceholderRow
                        key={`${address.chainId}_${address.address}`}
                        address={address}
                        chain={chain}
                      />
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <p>Loading chain data...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    </>
  );
};
