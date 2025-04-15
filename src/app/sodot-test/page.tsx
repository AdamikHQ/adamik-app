"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { SodotSigner } from "~/signers/Sodot";
import {
  AdamikCurve,
  AdamikHashFunction,
  AdamikSignerSpec,
} from "~/utils/types";
import { encodePubKeyToAddress } from "~/api/adamik/encode";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Server,
  ChevronDown,
} from "lucide-react";
import { useChains } from "~/hooks/useChains";
import { Chain } from "~/utils/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

type VertexKeysResult = {
  status?: number;
  data?: {
    vertices: Array<{
      id: number;
      status: number;
      compressed?: string;
      uncompressed?: string;
      error?: string;
    }>;
  };
  error?: string;
  message?: string;
};

type ChainPubkeyResult = {
  pubkey: string;
  address: string;
  chainId: string;
  curve: string;
  requestDetails?: {
    derivationPath: number[];
    coinType: number;
    curve: string;
    fromCache: boolean;
  };
};

type Results = {
  vertexKeys?: VertexKeysResult;
  chainPubkey?: ChainPubkeyResult;
};

export default function SodotTestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const { data: chains, isLoading: chainsLoading } = useChains();

  // Add effect to monitor state changes
  console.log("Component render - Current state:", {
    results,
    error,
    success,
    loading,
    chains,
    selectedChain,
  });

  const testChainPubkey = async () => {
    if (!chains || !selectedChain) {
      setError("Please select a chain first");
      return;
    }

    if (!chains[selectedChain]) {
      setError(`Chain ${selectedChain} not found in available chains`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`Starting ${selectedChain} pubkey test`);

      // Call our backend endpoint for the chain pubkey
      console.log("Fetching pubkey from backend");
      const response = await fetch(
        `/api/sodot-proxy/derive-chain-pubkey?chain=${selectedChain}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Received pubkey data:", data);

      // Get the pubkey from the response
      const pubkey = data.data.pubkey;
      console.log(`Extracted ${selectedChain} pubkey:`, pubkey);

      // Use the Adamik API to get the address from the pubkey
      console.log(`Calling encodePubKeyToAddress for ${selectedChain}`);
      const addressResult = await encodePubKeyToAddress(pubkey, selectedChain);
      console.log(`Received ${selectedChain} address result:`, addressResult);
      const address = addressResult.address;

      // Store the results
      console.log("Setting state with pubkey and address");
      const chainInfo = chains[selectedChain];
      const curveType =
        chainInfo.signerSpec.curve === "secp256k1" ? "SECP256K1" : "ED25519";

      setResults(
        (prev: Results | null): Results => ({
          ...prev,
          chainPubkey: {
            pubkey,
            address,
            chainId: selectedChain,
            curve: curveType,
            requestDetails: data.data.requestDetails,
          },
        })
      );
      console.log("State updated, setting success message");
      setSuccess(`Successfully retrieved ${selectedChain} pubkey and address`);
    } catch (e: any) {
      console.error(`Error in testChainPubkey for ${selectedChain}:`, e);
      setError(e.message || "Unknown error occurred");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const testSupportedChains = [
    "ethereum",
    "bitcoin",
    "ton",
    "tron",
    "algorand",
    "solana",
    "cosmos",
  ];

  const getVertexKeys = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/sodot-proxy/get-keys", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to get keys: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || data.error);
      }

      setResults(
        (prev: Results | null): Results => ({ ...prev, vertexKeys: data })
      );
      setSuccess("Successfully retrieved vertex keys");
    } catch (e: any) {
      setError(e.message || "Failed to get keys");
      console.error("Error getting vertex keys:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-auto p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Sodot MPC Signing Demo</h1>
          <p className="text-muted-foreground mt-2">
            Test the Sodot secure signing integration with various blockchains
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mb-6">
              <Button
                onClick={getVertexKeys}
                disabled={loading}
                variant="outline"
                className="w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting vertex keys...
                  </>
                ) : (
                  "Get Vertex Keys"
                )}
              </Button>

              <div className="flex flex-col md:flex-row gap-4 items-center">
                {chains ? (
                  <>
                    <div className="w-full md:w-64">
                      <Select
                        value={selectedChain}
                        onValueChange={setSelectedChain}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select chain" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(chains)
                            .sort(([, a], [, b]) =>
                              a.name.localeCompare(b.name)
                            )
                            .map(([chainId, chain]) => (
                              <SelectItem key={chainId} value={chainId}>
                                {chain.name} ({chain.ticker})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={testChainPubkey}
                      disabled={loading || !selectedChain}
                      variant="default"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading chains...
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive flex items-center p-4 rounded-md mb-4">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 flex items-center p-4 rounded-md mb-4">
                <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}

            {results && (
              <div className="space-y-4">
                {results.chainPubkey && (
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
                    <h2 className="font-bold text-black dark:text-white">
                      Pubkey Results:
                    </h2>
                    <div className="text-black dark:text-white">
                      Chain: {results.chainPubkey.chainId}
                    </div>
                    <div className="text-black dark:text-white">
                      Curve: {results.chainPubkey.curve}
                    </div>
                    <div className="break-all text-black dark:text-white">
                      Pubkey: {results.chainPubkey.pubkey}
                    </div>
                    <div className="break-all text-black dark:text-white">
                      Address: {results.chainPubkey.address}
                    </div>

                    {results.chainPubkey.requestDetails && (
                      <div className="mt-3 border-t pt-3">
                        <h3 className="font-medium text-black dark:text-white mb-2">
                          Request Details (Sent to Sodot):
                        </h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                          <div className="text-black dark:text-white mb-1">
                            <span className="font-medium">BIP-44 Path:</span> m/
                            {results.chainPubkey.requestDetails.derivationPath.join(
                              "/"
                            )}
                          </div>
                          <div className="text-black dark:text-white mb-1">
                            <span className="font-medium">Coin Type:</span>{" "}
                            {results.chainPubkey.requestDetails.coinType}
                          </div>
                          <div className="text-black dark:text-white mb-1">
                            <span className="font-medium">Curve:</span>{" "}
                            {results.chainPubkey.requestDetails.curve}
                          </div>
                          <div className="text-black dark:text-white">
                            <span className="font-medium">Source:</span>{" "}
                            {results.chainPubkey.requestDetails.fromCache
                              ? "Retrieved from cache"
                              : "Derived from Sodot vertices"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Debug output */}
                <pre className="bg-gray-200 dark:bg-gray-700 p-4 rounded text-xs overflow-auto text-black dark:text-white">
                  {JSON.stringify({ results, success, error }, null, 2)}
                </pre>

                {results.vertexKeys &&
                  results.vertexKeys.data &&
                  results.vertexKeys.data.vertices &&
                  results.vertexKeys.data.vertices.length > 0 && (
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
                      <h2 className="font-bold mb-2 text-black dark:text-white">
                        Vertex Keys:
                      </h2>
                      <div className="space-y-4">
                        {results.vertexKeys.data.vertices.map((vertex) => (
                          <div key={vertex.id} className="border-t pt-2">
                            <h3 className="font-semibold text-black dark:text-white">
                              Vertex {vertex.id}
                            </h3>
                            <div className="text-black dark:text-white">
                              Status: {vertex.status}
                            </div>
                            {vertex.error && (
                              <div className="text-red-500">
                                Error: {vertex.error}
                              </div>
                            )}
                            {vertex.compressed && (
                              <div className="break-all text-black dark:text-white">
                                <span className="font-medium">Compressed:</span>{" "}
                                {vertex.compressed}
                              </div>
                            )}
                            {vertex.uncompressed && (
                              <div className="break-all text-black dark:text-white">
                                <span className="font-medium">
                                  Uncompressed:
                                </span>{" "}
                                {vertex.uncompressed}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This demo showcases Threshold Signature Scheme (TSS) integration
              using Sodot&apos;s secure MPC protocol. The implementation
              features:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <div className="flex items-center">
                  <Server className="h-4 w-4 mr-2 text-blue-500" />
                  Server-side proxy to securely handle API keys and key IDs
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-blue-500" />
                  No sensitive environment variables on the client
                </div>
              </li>
              <li>Multi-party computation for key generation and signing</li>
              <li>
                Threshold security (t-of-n) where at least 2 of 3 parties must
                participate
              </li>
              <li>
                Support for multiple blockchain cryptography (ECDSA for
                Bitcoin/Ethereum/TON/Tron, ED25519 for Algorand)
              </li>
              <li>Integration with Adamik API for address derivation</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
