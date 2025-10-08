"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Server } from "lucide-react";
import { SignerType, SIGNER_CONFIGS } from "~/signers/types";
import { SignerFactory } from "~/signers/SignerFactory";
import { Badge } from "~/components/ui/badge";

type TestResult = {
  success: boolean;
  message: string;
  details?: any;
};

type SignerTestState = {
  testing: boolean;
  testResult: TestResult | null;
  selectedChain: string;
};

const signerInfo = {
  [SignerType.SODOT]: {
    icon: Shield,
    name: "Sodot MPC",
    shortDesc: "Secure multi-party computation",
    type: "2-of-3 threshold MPC",
    color: "blue",
  },
  [SignerType.IOFINNET]: {
    icon: Lock,
    name: "IoFinnet Vault",
    shortDesc: "Enterprise MPC with approvals",
    type: "Mobile approval required",
    color: "purple",
  },
  [SignerType.TURNKEY]: {
    icon: Cloud,
    name: "Turnkey",
    shortDesc: "Cloud-based key management",
    type: "API-based signing",
    color: "green",
  },
  [SignerType.BLOCKDAEMON]: {
    icon: Server,
    name: "BlockDaemon Vault",
    shortDesc: "Enterprise TSM",
    type: "2-of-3 threshold signing",
    color: "orange",
  },
  [SignerType.DFNS]: {
    icon: Shield,
    name: "Dfns",
    shortDesc: "Secure key management",
    type: "Flexible wallet infrastructure",
    color: "indigo",
  },
};

export function SignerConfigurationContent() {
  const currentSigner = SignerFactory.getSelectedSignerType();
  const { data: chains } = useFilteredChains();

  // BlockDaemon Demo: Only BlockDaemon state needed
  const [blockdaemonState, setBlockdaemonState] = useState<SignerTestState>({
    testing: false,
    testResult: null,
    selectedChain: "",
  });

  // Test BlockDaemon connection
  const testBlockdaemonConnection = async () => {
    setBlockdaemonState(prev => ({ ...prev, testing: true, testResult: null }));

    try {
      const response = await fetch("/api/blockdaemon-proxy/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Connection test failed");
      }

      setBlockdaemonState(prev => ({
        ...prev,
        testResult: {
          success: true,
          message: data.message || "Successfully connected to BlockDaemon TSM",
          details: data.details,
        }
      }));
    } catch (error: any) {
      setBlockdaemonState(prev => ({
        ...prev,
        testResult: {
          success: false,
          message: error.message || "Failed to test BlockDaemon connection",
        }
      }));
    } finally {
      setBlockdaemonState(prev => ({ ...prev, testing: false }));
    }
  };


  // BlockDaemon Demo: Simplified component - only BlockDaemon card
  const info = signerInfo[SignerType.BLOCKDAEMON];
  const config = SIGNER_CONFIGS[SignerType.BLOCKDAEMON];
  const Icon = info.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">BlockDaemon TSM Configuration</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This demo uses BlockDaemon's Threshold Signature Manager (TSM) for secure key management.
        </p>
      </div>

      {/* BlockDaemon Card */}
      <Card className="relative overflow-hidden ring-2 ring-primary shadow-lg">
        {/* Active indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  {info.name}
                  <Badge variant="default" className="text-xs">Active</Badge>
                </CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  {info.shortDesc}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Signer details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{info.type}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Supported curves</span>
              <span className="font-medium">{config.supportedCurves.length} curves</span>
            </div>
          </div>

          <div className="border-t" />

          {/* Test result */}
          {blockdaemonState.testResult && (
            <div className={`p-3 rounded-lg border ${
              blockdaemonState.testResult.success
                ? 'border-green-200 bg-green-50 dark:bg-green-900/10'
                : 'border-destructive/50 bg-destructive/5'
            }`}>
              <div className="flex items-start gap-2">
                {blockdaemonState.testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                )}
                <div className="text-sm flex-1">
                  {blockdaemonState.testResult.message}
                </div>
              </div>
            </div>
          )}

          {/* Test button */}
          <Button
            onClick={testBlockdaemonConnection}
            disabled={blockdaemonState.testing}
            className="w-full"
            variant="default"
          >
            {blockdaemonState.testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info section */}
      <div className="p-4 rounded-lg border bg-muted/50">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-sm text-muted-foreground">
            BlockDaemon TSM is the only signing provider in this demo. It uses 2-of-3 threshold signing for enhanced security.
          </p>
        </div>
      </div>
    </div>
  );
}