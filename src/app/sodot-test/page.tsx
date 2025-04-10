"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function SodotTestPage() {
  const [loading, setLoading] = useState(false);
  const [connectionResults, setConnectionResults] = useState<Record<
    string,
    any
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sodot/test-connection");
      const data = await response.json();
      setConnectionResults(data);
    } catch (e: any) {
      setError(e.message || "Unknown error occurred");
      console.error("Error testing connection:", e);
    } finally {
      setLoading(false);
    }
  };

  const testEcdsaPubkey = async () => {
    setLoading(true);
    setError(null);
    try {
      const keyId =
        connectionResults?.envStatus?.serverSide?.SODOT_EXISTING_ECDSA_KEY_IDS >
        0
          ? process.env.NEXT_PUBLIC_SODOT_EXISTING_ECDSA_KEY_IDS?.split(",")[0]
          : "8306e478-e39f-4e68-9c87-fdf9bfa6d1ad";

      const response = await fetch("/api/sodot/pubkey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          curve: "ecdsa",
          keyId: keyId,
          derivationPath: [44, 60, 0, 0, 0],
        }),
      });

      const data = await response.json();
      setConnectionResults((prev: Record<string, any> | null) => ({
        ...(prev || {}),
        ecdsaPubkeyTest: {
          keyId,
          data,
        },
      }));
    } catch (e: any) {
      setError(e.message || "Unknown error occurred");
      console.error("Error testing ECDSA pubkey:", e);
    } finally {
      setLoading(false);
    }
  };

  const testEd25519Pubkey = async () => {
    setLoading(true);
    setError(null);
    try {
      const keyId =
        connectionResults?.envStatus?.serverSide
          ?.SODOT_EXISTING_ED25519_KEY_IDS > 0
          ? process.env.NEXT_PUBLIC_SODOT_EXISTING_ED25519_KEY_IDS?.split(
              ","
            )[0]
          : "868a7bea-a410-40d3-a03a-ea06200f9fe6";

      const response = await fetch("/api/sodot/pubkey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          curve: "ed25519",
          keyId: keyId,
          derivationPath: [44, 118, 0, 0, 0],
        }),
      });

      const data = await response.json();
      setConnectionResults((prev: Record<string, any> | null) => ({
        ...(prev || {}),
        ed25519PubkeyTest: {
          keyId,
          data,
        },
      }));
    } catch (e: any) {
      setError(e.message || "Unknown error occurred");
      console.error("Error testing ED25519 pubkey:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Sodot Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row gap-4 mb-4">
            <Button onClick={testConnection} disabled={loading}>
              {loading ? "Testing..." : "Test Sodot Connection"}
            </Button>

            {connectionResults && (
              <>
                <Button onClick={testEcdsaPubkey} disabled={loading}>
                  Test ECDSA Pubkey
                </Button>
                <Button onClick={testEd25519Pubkey} disabled={loading}>
                  Test ED25519 Pubkey
                </Button>
              </>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

          {connectionResults && (
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">Connection Results</h3>
              <div className="overflow-auto max-h-[500px] rounded border border-gray-300">
                <pre className="p-2">
                  {JSON.stringify(connectionResults, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
