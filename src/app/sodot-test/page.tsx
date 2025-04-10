"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { SodotSigner } from "~/signers/Sodot";
import {
  AdamikCurve,
  AdamikHashFunction,
  AdamikSignerSpec,
} from "~/adamik/types";
import { encodePubKeyToAddress } from "~/api/adamik/encode";
import { AlertCircle, CheckCircle2, Loader2, Lock, Server } from "lucide-react";

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

  // Add effect to monitor state changes
  console.log("Component render - Current state:", {
    results,
    error,
    success,
    loading,
  });

  const testEthereumPubkey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      console.log("Starting Ethereum pubkey test");

      // Call our backend endpoint for Ethereum pubkey
      console.log("Fetching pubkey from backend");
      const response = await fetch(
        "/api/sodot-proxy/derive-chain-pubkey?chain=ethereum",
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
      console.log("Extracted pubkey:", pubkey);

      // Use the Adamik API to get the address from the pubkey
      console.log("Calling encodePubKeyToAddress for Ethereum");
      const addressResult = await encodePubKeyToAddress(pubkey, "ethereum");
      console.log("Received address result:", addressResult);
      const address = addressResult.address;

      // Store the results
      console.log("Setting state with pubkey and address");
      setResults(
        (prev: Results | null): Results => ({
          ...prev,
          chainPubkey: {
            pubkey,
            address,
            chainId: "ethereum",
            curve: "SECP256K1",
          },
        })
      );
      console.log("State updated, setting success message");
      setSuccess("Successfully retrieved Ethereum pubkey and address");
    } catch (e: any) {
      console.error("Error in testEthereumPubkey:", e);
      setError(e.message || "Unknown error occurred");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const testBitcoinPubkey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      console.log("Starting Bitcoin pubkey test");

      // Call our backend endpoint for Bitcoin pubkey
      console.log("Fetching pubkey from backend");
      const response = await fetch(
        "/api/sodot-proxy/derive-chain-pubkey?chain=bitcoin",
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
      console.log("Extracted pubkey:", pubkey);

      // Use the Adamik API to get the address from the pubkey
      console.log("Calling encodePubKeyToAddress for Bitcoin");
      const addressResult = await encodePubKeyToAddress(pubkey, "bitcoin");
      console.log("Received address result:", addressResult);
      const address = addressResult.address;

      // Store the results
      console.log("Setting state with pubkey and address");
      setResults(
        (prev: Results | null): Results => ({
          ...prev,
          chainPubkey: {
            pubkey,
            address,
            chainId: "bitcoin",
            curve: "SECP256K1",
          },
        })
      );
      console.log("State updated, setting success message");
      setSuccess("Successfully retrieved Bitcoin pubkey and address");
    } catch (e: any) {
      console.error("Error in testBitcoinPubkey:", e);
      setError(e.message || "Unknown error occurred");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const testTONPubkey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      console.log("Starting TON pubkey test");

      // Call our backend endpoint for TON pubkey
      console.log("Fetching pubkey from backend");
      const response = await fetch(
        "/api/sodot-proxy/derive-chain-pubkey?chain=ton",
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
      console.log("Extracted TON pubkey:", pubkey);

      // Use the Adamik API to get the address from the pubkey
      console.log("Calling encodePubKeyToAddress for TON");
      const addressResult = await encodePubKeyToAddress(pubkey, "ton");
      console.log("Received TON address result:", addressResult);
      const address = addressResult.address;

      // Store the results
      console.log("Setting state with TON pubkey and address");
      setResults(
        (prev: Results | null): Results => ({
          ...prev,
          chainPubkey: {
            pubkey,
            address,
            chainId: "ton",
            curve: "SECP256K1",
          },
        })
      );
      console.log("State updated, setting success message");
      setSuccess("Successfully retrieved TON pubkey and address");
    } catch (e: any) {
      console.error("Error in testTONPubkey:", e);
      setError(e.message || "Unknown error occurred");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const testTronPubkey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      console.log("Starting Tron pubkey test");

      // Call our backend endpoint for Tron pubkey
      console.log("Fetching pubkey from backend");
      const response = await fetch(
        "/api/sodot-proxy/derive-chain-pubkey?chain=tron",
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
      console.log("Extracted pubkey:", pubkey);

      // Use the Adamik API to get the address from the pubkey
      console.log("Calling encodePubKeyToAddress for Tron");
      const addressResult = await encodePubKeyToAddress(pubkey, "tron");
      console.log("Received address result:", addressResult);
      const address = addressResult.address;

      // Store the results
      console.log("Setting state with pubkey and address");
      setResults(
        (prev: Results | null): Results => ({
          ...prev,
          chainPubkey: {
            pubkey,
            address,
            chainId: "tron",
            curve: "SECP256K1",
          },
        })
      );
      console.log("State updated, setting success message");
      setSuccess("Successfully retrieved Tron pubkey and address");
    } catch (e: any) {
      console.error("Error in testTronPubkey:", e);
      setError(e.message || "Unknown error occurred");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const testAlgorandPubkey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      console.log("Starting Algorand pubkey test");

      // Call our backend endpoint for Algorand pubkey
      console.log("Fetching pubkey from backend");
      const response = await fetch(
        "/api/sodot-proxy/derive-chain-pubkey?chain=algorand",
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
      console.log("Extracted Algorand pubkey:", pubkey);

      // Use the Adamik API to get the address from the pubkey
      console.log("Calling encodePubKeyToAddress for Algorand");
      const addressResult = await encodePubKeyToAddress(pubkey, "algorand");
      console.log("Received Algorand address result:", addressResult);
      const address = addressResult.address;

      // Store the results
      console.log("Setting state with Algorand pubkey and address");
      setResults(
        (prev: Results | null): Results => ({
          ...prev,
          chainPubkey: {
            pubkey,
            address,
            chainId: "algorand",
            curve: "ED25519",
          },
        })
      );
      console.log("State updated, setting success message");
      setSuccess("Successfully retrieved Algorand pubkey and address");
    } catch (e: any) {
      console.error("Error in testAlgorandPubkey:", e);
      setError(e.message || "Unknown error occurred");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

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
            <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap">
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
              <Button
                onClick={testEthereumPubkey}
                disabled={loading}
                variant="default"
                className="w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Ethereum"
                )}
              </Button>
              <Button
                onClick={testBitcoinPubkey}
                disabled={loading}
                variant="default"
                className="w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Bitcoin"
                )}
              </Button>
              <Button
                onClick={testTONPubkey}
                disabled={loading}
                variant="default"
                className="w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "TON"
                )}
              </Button>
              <Button
                onClick={testTronPubkey}
                disabled={loading}
                variant="default"
                className="w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Tron"
                )}
              </Button>
              <Button
                onClick={testAlgorandPubkey}
                disabled={loading}
                variant="default"
                className="w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Algorand"
                )}
              </Button>
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
              using Sodot's secure MPC protocol. The implementation features:
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
