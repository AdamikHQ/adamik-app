import React, { useCallback, useState, useEffect } from "react";
import { useToast } from "~/components/ui/use-toast";
import { useWallet } from "~/hooks/useWallet";
import { Account, WalletConnectorProps, WalletName } from "./types";
import { SodotSigner } from "~/signers/Sodot";
import {
  AdamikCurve,
  AdamikHashFunction,
  AdamikSignerSpec,
  Chain,
} from "~/utils/types";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { getChains } from "~/api/adamik/chains";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card } from "~/components/ui/card";

export const SodotConnect: React.FC<WalletConnectorProps> = ({
  chainId: providedChainId,
  transactionPayload,
}) => {
  const { toast } = useToast();
  const { addAddresses } = useWallet();
  const [loading, setLoading] = useState(false);
  const [chains, setChains] = useState<Record<string, Chain> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<string>(
    providedChainId || ""
  );

  // Fetch chains data when component mounts
  useEffect(() => {
    const fetchChains = async () => {
      try {
        const chainsData = await getChains();
        if (chainsData) {
          setChains(chainsData);
        } else {
          setError("Failed to load chain information");
        }
      } catch (e) {
        console.error("Error fetching chains:", e);
        setError("Failed to load chain information");
      }
    };

    fetchChains();
  }, []);

  // Update selected chain when providedChainId changes
  useEffect(() => {
    if (providedChainId) {
      setSelectedChainId(providedChainId);
    }
  }, [providedChainId]);

  const getAddresses = useCallback(async () => {
    if (!chains || !selectedChainId) {
      toast({
        description: "Please select a chain",
        variant: "destructive",
      });
      return;
    }

    const chain = chains[selectedChainId];
    if (!chain) {
      toast({
        description: `Chain ${selectedChainId} not supported`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create signer spec from the chain data
      const signerSpec: AdamikSignerSpec = {
        curve:
          chain.signerSpec.curve === "secp256k1"
            ? AdamikCurve.SECP256K1
            : AdamikCurve.ED25519,
        hashFunction:
          chain.signerSpec.hashFunction === "keccak256"
            ? AdamikHashFunction.KECCAK256
            : AdamikHashFunction.SHA256,
        coinType: chain.signerSpec.coinType,
        signatureFormat: chain.signerSpec.signatureFormat,
      };

      const sodotSigner = new SodotSigner(selectedChainId, signerSpec);

      // Get public key and address
      const pubkey = await sodotSigner.getPubkey();
      const address = await sodotSigner.getAddress();

      // Create account with the address and public key
      const account: Account = {
        address: address,
        chainId: selectedChainId,
        pubKey: pubkey,
        signer: WalletName.SODOT,
      };

      addAddresses([account]);

      toast({
        description:
          "Connected to Sodot Wallet, please check portfolio page to see your assets",
      });
    } catch (e) {
      console.error("Sodot connection error:", e);
      toast({
        description: `Failed to connect to Sodot Wallet: ${
          e instanceof Error ? e.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedChainId, addAddresses, toast, chains]);

  const sign = useCallback(async () => {
    if (!transactionPayload || !chains || !providedChainId) return;

    const chain = chains[providedChainId];
    if (!chain) {
      toast({
        description: `Chain ${providedChainId} not supported`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create signer spec from the chain data
      const signerSpec: AdamikSignerSpec = {
        curve:
          chain.signerSpec.curve === "secp256k1"
            ? AdamikCurve.SECP256K1
            : AdamikCurve.ED25519,
        hashFunction:
          chain.signerSpec.hashFunction === "keccak256"
            ? AdamikHashFunction.KECCAK256
            : AdamikHashFunction.SHA256,
        coinType: chain.signerSpec.coinType,
        signatureFormat: chain.signerSpec.signatureFormat,
      };

      const sodotSigner = new SodotSigner(providedChainId, signerSpec);
      const signature = await sodotSigner.signTransaction(
        transactionPayload.encoded
      );

      // Handle the signature as needed
      console.log("Transaction signed:", signature);

      toast({
        description: "Transaction signed successfully",
      });
    } catch (err) {
      console.warn("Failed to sign with Sodot wallet:", err);
      toast({
        description: err instanceof Error ? err.message : "Transaction failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [providedChainId, transactionPayload, toast, chains]);

  if (error) {
    return (
      <Button className="w-full" disabled>
        Error: {error}
      </Button>
    );
  }

  if (!chains) {
    return (
      <Button className="w-full" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading chain info...
      </Button>
    );
  }

  // If a specific chainId is provided or we're signing a transaction, show simple connect/sign button
  if (providedChainId || transactionPayload) {
    return (
      <Button
        className="w-full"
        onClick={transactionPayload ? () => sign() : () => getAddresses()}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {transactionPayload ? "Signing..." : "Connecting..."}
          </>
        ) : transactionPayload ? (
          "Sign Transaction"
        ) : (
          "Connect Sodot Wallet"
        )}
      </Button>
    );
  }

  // If no chainId is provided, show chain selector
  return (
    <Card className="p-4 w-full">
      <h3 className="text-lg font-medium mb-4">Connect Sodot Wallet</h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Select Chain</label>
          <Select
            value={selectedChainId}
            onValueChange={setSelectedChainId}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a chain" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(chains)
                .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                .map(([id, chain]) => (
                  <SelectItem key={id} value={id}>
                    {chain.name} ({chain.ticker})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="w-full"
          onClick={() => getAddresses()}
          disabled={!selectedChainId || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect"
          )}
        </Button>
      </div>
    </Card>
  );
};
