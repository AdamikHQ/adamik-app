"use client";

import { useAccount, useStarkName } from "@starknet-react/core";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { useState, useEffect } from "react";
import { mainnet } from "@starknet-react/chains";

export const AccountInfo = () => {
  const { address, isConnected, chainId } = useAccount();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // useStarkName attempts to resolve a StarkNet ID (similar to ENS) for the given address
  // StarkNet ID is a naming service that maps human-readable names to StarkNet addresses
  const { data: starknetId } = useStarkName({
    address,
  });

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        description: "Address copied to clipboard",
        duration: 2000,
      });
    }
  };

  if (!isClient) {
    return null;
  }

  // Network detection based on chainId
  const isMainnet = chainId === mainnet.id;

  // Determine network name
  const networkName = isMainnet ? "Mainnet" : "Sepolia Testnet";

  return (
    <Card className="h-full min-h-[280px]">
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <InfoItem
            label="Connection Status"
            value={isConnected ? "Connected" : "Not connected"}
            isConnected={isConnected}
          />
          <InfoItem
            label="Address"
            value={address || "-"}
            fullValue={address}
            canCopy={!!address}
            onCopy={handleCopyAddress}
          />
          <InfoItem label="StarkNet ID" value={starknetId || "-"} />
        </div>
      </CardContent>
    </Card>
  );
};

interface InfoItemProps {
  label: string;
  value: string;
  fullValue?: string;
  canCopy?: boolean;
  onCopy?: () => void;
  isConnected?: boolean;
}

const InfoItem = ({
  label,
  value,
  fullValue,
  canCopy,
  onCopy,
  isConnected,
}: InfoItemProps) => (
  <div className="flex flex-col">
    <span className="text-sm text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2">
      <span className={`font-medium ${isConnected ? "text-green-500" : ""}`}>
        {value}
      </span>
      {canCopy && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={onCopy}
          title={fullValue}
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  </div>
);
