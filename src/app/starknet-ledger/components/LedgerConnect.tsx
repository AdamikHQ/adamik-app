"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { useLedgerContext } from "~/providers/LedgerProvider";

export const LedgerConnect = () => {
  const { isConnected, isConnecting, error, publicKey, connect, disconnect } =
    useLedgerContext();
  const { toast } = useToast();

  // Handle connection state changes
  useEffect(() => {
    if (isConnected && publicKey) {
      toast({
        title: "Connected successfully",
        description: `Ledger address: ${publicKey}`,
        duration: 5000,
      });
    }
  }, [isConnected, publicKey, toast]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Connection failed",
        description:
          error.message ||
          "Failed to connect to Ledger. Please make sure your StarkNet app is open.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [error, toast]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Ledger connection error:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Disconnected",
        description: "Your Ledger device has been disconnected.",
        duration: 5000,
      });
    } catch (error) {
      console.error("Ledger disconnection error:", error);
      toast({
        title: "Disconnection failed",
        description: "Failed to disconnect from Ledger.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="w-full"
        onClick={isConnected ? handleDisconnect : handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting to Ledger...
          </>
        ) : isConnected ? (
          "Disconnect Ledger"
        ) : (
          "Connect Ledger"
        )}
      </Button>
    </div>
  );
};
