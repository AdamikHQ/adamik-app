"use client";

import { Copy } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useToast } from "~/components/ui/use-toast";
import { useLedgerContext } from "~/providers/LedgerProvider";

export const AccountInfo = () => {
  const { address, isConnected } = useLedgerContext();
  const { toast } = useToast();

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        description: "Address copied to clipboard",
        duration: 2000,
      });
    }
  };

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
            fullValue={address || ""}
            canCopy={!!address}
            onCopy={handleCopyAddress}
          />
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
