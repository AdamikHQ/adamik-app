"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Server, Shield } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SignerType, SIGNER_CONFIGS } from "~/signers/types";
import { useChains } from "~/hooks/useChains";

type TestResult = {
  success: boolean;
  message: string;
  details?: any;
};

export function SignerConfigurationContent() {
  const [selectedSigner, setSelectedSigner] = useState<SignerType>(SignerType.SODOT);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { data: chains, isLoading: chainsLoading } = useChains();
  
  // Load saved signer preference
  useEffect(() => {
    const savedSigner = localStorage.getItem("preferredSigner") as SignerType;
    if (savedSigner && Object.values(SignerType).includes(savedSigner)) {
      setSelectedSigner(savedSigner);
    }
  }, []);

  // Save signer preference
  const handleSignerChange = (value: SignerType) => {
    setSelectedSigner(value);
    localStorage.setItem("preferredSigner", value);
    setTestResult(null);
  };

  // Test connection with selected signer
  const testSignerConnection = async () => {
    if (!selectedChain || !chains) {
      setTestResult({
        success: false,
        message: "Please select a chain first",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Call the appropriate API endpoint based on signer
      const endpoint = selectedSigner === SignerType.SODOT 
        ? `/api/sodot-proxy/derive-chain-pubkey`
        : `/api/iofinnet-proxy/test-connection`;

      const response = await fetch(
        `${endpoint}?chain=${selectedChain}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Connection test failed: ${response.status}`);
      }

      setTestResult({
        success: true,
        message: `Successfully connected to ${SIGNER_CONFIGS[selectedSigner].displayName}`,
        details: {
          chain: selectedChain,
          pubkey: data.data?.pubkey,
          address: data.data?.address,
        },
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Connection test failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const signerConfig = SIGNER_CONFIGS[selectedSigner];

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Signer Configuration</h2>
        <p className="text-muted-foreground mt-2">
          Select and configure your preferred signing method for transactions
        </p>
      </div>

      {/* Signer Selection Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Active Signer</CardTitle>
          <CardDescription>
            Choose which signer to use for all wallet operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <Select
                value={selectedSigner}
                onValueChange={handleSignerChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a signer" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SIGNER_CONFIGS).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>{config.displayName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Signer Info */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">{signerConfig.displayName}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {signerConfig.description}
                </p>
                <div className="text-sm">
                  <span className="font-medium">Supported Curves: </span>
                  {signerConfig.supportedCurves.join(", ")}
                </div>
                {signerConfig.requiresSetup && (
                  <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      {signerConfig.setupInstructions}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Test Card */}
      <Card>
        <CardHeader>
          <CardTitle>Test Connection</CardTitle>
          <CardDescription>
            Verify that the selected signer is properly configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chain Selection */}
            <div className="flex flex-col md:flex-row gap-4">
              {chains ? (
                <>
                  <Select
                    value={selectedChain}
                    onValueChange={setSelectedChain}
                    disabled={testing}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a chain to test" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(chains)
                        .filter(([_, chain]) => {
                          // Filter chains based on signer's supported curves
                          const curveType = chain.signerSpec.curve === "secp256k1" 
                            ? "secp256k1" 
                            : "ed25519";
                          return signerConfig.supportedCurves.includes(curveType);
                        })
                        .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                        .map(([chainId, chain]) => (
                          <SelectItem key={chainId} value={chainId}>
                            {chain.name} ({chain.ticker})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={testSignerConnection}
                    disabled={testing || !selectedChain}
                    className="min-w-[150px]"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Server className="mr-2 h-4 w-4" />
                        Test Connection
                      </>
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

            {/* Test Results */}
            {testResult && (
              <div
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  testResult.success
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{testResult.message}</p>
                  {testResult.success && testResult.details && (
                    <div className="mt-2 text-sm space-y-1">
                      {testResult.details.chain && (
                        <div>
                          <span className="font-medium">Chain:</span> {testResult.details.chain}
                        </div>
                      )}
                      {testResult.details.pubkey && (
                        <div className="break-all">
                          <span className="font-medium">Public Key:</span> {testResult.details.pubkey}
                        </div>
                      )}
                      {testResult.details.address && (
                        <div className="break-all">
                          <span className="font-medium">Address:</span> {testResult.details.address}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              The signer is responsible for managing your private keys and signing transactions.
              Each signer has different security properties:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Sodot MPC:</strong> Uses secure multi-party computation with a 2-of-3 
                threshold. Keys are never stored in a single location.
              </li>
              <li>
                <strong>IoFinnet:</strong> Enterprise-grade MPC with approval workflows. 
                Ideal for organizations requiring multiple approvals.
              </li>
            </ul>
            <p className="text-muted-foreground">
              Your signer preference is saved locally and will be used for all future transactions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}