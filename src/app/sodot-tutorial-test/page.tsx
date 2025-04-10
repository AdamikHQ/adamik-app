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

export default function SodotTutorialTestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const testEthereumPubkey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Create ethereum signer spec
      const signerSpec: AdamikSignerSpec = {
        curve: AdamikCurve.SECP256K1,
        coinType: "60", // Ethereum
        hashFunction: AdamikHashFunction.KECCAK256,
        signatureFormat: "r|s|v",
      };

      // Initialize the Sodot signer
      const signer = new SodotSigner("ethereum", signerSpec);

      // Get the pubkey
      const pubkey = await signer.getPubkey();

      // Get the address (which calls the Adamik API)
      const address = await signer.getAddress();

      // Store the results
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
      setSuccess("Successfully retrieved Ethereum pubkey and address");
    } catch (e: any) {
      setError(e.message || "Unknown error occurred");
      console.error("Error testing Ethereum pubkey:", e);
    } finally {
      setLoading(false);
    }
  };

  const testBitcoinPubkey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Create bitcoin signer spec
      const signerSpec: AdamikSignerSpec = {
        curve: AdamikCurve.SECP256K1,
        coinType: "0", // Bitcoin
        hashFunction: AdamikHashFunction.SHA256,
        signatureFormat: "der",
      };

      // Initialize the Sodot signer
      const signer = new SodotSigner("bitcoin", signerSpec);

      // Get the pubkey
      const pubkey = await signer.getPubkey();

      // Get the address (which calls the Adamik API)
      const address = await signer.getAddress();

      // Store the results
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
      setSuccess("Successfully retrieved Bitcoin pubkey and address");
    } catch (e: any) {
      setError(e.message || "Unknown error occurred");
      console.error("Error testing Bitcoin pubkey:", e);
    } finally {
      setLoading(false);
    }
  };

  const testSolanaPubkey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Create solana signer spec
      const signerSpec: AdamikSignerSpec = {
        curve: AdamikCurve.ED25519,
        coinType: "501", // Solana
        hashFunction: AdamikHashFunction.SHA256,
        signatureFormat: "signature",
      };

      // Initialize the Sodot signer
      const signer = new SodotSigner("solana", signerSpec);

      // Get the pubkey
      const pubkey = await signer.getPubkey();

      // Get the address (which calls the Adamik API)
      const address = await signer.getAddress();

      // Store the results
      setResults(
        (prev: Results | null): Results => ({
          ...prev,
          chainPubkey: {
            pubkey,
            address,
            chainId: "solana",
            curve: "ED25519",
          },
        })
      );
      setSuccess("Successfully retrieved Solana pubkey and address");
    } catch (e: any) {
      setError(e.message || "Unknown error occurred");
      console.error("Error testing Solana pubkey:", e);
    } finally {
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
            <div className="flex flex-col md:flex-row gap-4 mb-6">
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
                onClick={testSolanaPubkey}
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
                  "Solana"
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
                  <div className="bg-gray-100 p-4 rounded">
                    <h2 className="font-bold">Pubkey Results:</h2>
                    <div>Chain: {results.chainPubkey.chainId}</div>
                    <div>Curve: {results.chainPubkey.curve}</div>
                    <div className="break-all">
                      Pubkey: {results.chainPubkey.pubkey}
                    </div>
                    <div className="break-all">
                      Address: {results.chainPubkey.address}
                    </div>
                  </div>
                )}

                {results.vertexKeys &&
                  results.vertexKeys.data &&
                  results.vertexKeys.data.vertices &&
                  results.vertexKeys.data.vertices.length > 0 && (
                    <div className="bg-gray-100 p-4 rounded">
                      <h2 className="font-bold mb-2">Vertex Keys:</h2>
                      <div className="space-y-4">
                        {results.vertexKeys.data.vertices.map((vertex) => (
                          <div key={vertex.id} className="border-t pt-2">
                            <h3 className="font-semibold">
                              Vertex {vertex.id}
                            </h3>
                            <div>Status: {vertex.status}</div>
                            {vertex.error && (
                              <div className="text-red-500">
                                Error: {vertex.error}
                              </div>
                            )}
                            {vertex.compressed && (
                              <div className="break-all">
                                <span className="font-medium">Compressed:</span>{" "}
                                {vertex.compressed}
                              </div>
                            )}
                            {vertex.uncompressed && (
                              <div className="break-all">
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
                Bitcoin/Ethereum, ED25519 for Solana)
              </li>
              <li>Integration with Adamik API for address derivation</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
