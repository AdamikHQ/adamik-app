"use client";

import { ChevronDown, ChevronRight, CheckCircle, Loader2, OctagonX, AlertTriangle, ShieldQuestion } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { TransactionEncodeResponse } from "~/utils/types";
import { AdamikSDK, VerificationResult } from "@adamik/sdk";

type TransactionVerificationProps = {
  apiResponse: TransactionEncodeResponse;
};

export function TransactionVerification({
  apiResponse,
}: TransactionVerificationProps) {
  const { raw: transactionRaw } = apiResponse.transaction.encoded[0];
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [showRawTransaction, setShowRawTransaction] = useState(false);

  const adamikSDK = useMemo(() => new AdamikSDK(), []);

  useEffect(() => {
    const verifyTransaction = async () => {
      setIsVerifying(true);
      
      // DEBUG to test error display
      //apiResponse.transaction.data.amount = "123454321";
      //apiResponse.transaction.data.recipientAddress = "0x0000000000000000000000000000000000000000";
      
      const result = await adamikSDK.verify(
        apiResponse,
        apiResponse.transaction.data
      );

      setVerificationResult(result);
      setIsVerifying(false);
    };

    verifyTransaction();
  }, [adamikSDK, apiResponse]);

  const sdkErrors = verificationResult?.errors || [];
  const verificationErrors = verificationResult?.criticalErrors || [];
  
  // Function to format field names for display
  const formatFieldName = (field: string) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Function to format values for display
  const formatValue = (value: any) => {
    if (value === undefined || value === null) {
      return <span className="text-gray-500 italic">Not set</span>;
    }
    if (typeof value === "string" && value.length > 20) {
      return (
        <span className="font-mono text-xs break-all">
          {value.slice(0, 8)}...{value.slice(-6)}
        </span>
      );
    }
    return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
  };

  return (
    <>
      <div className="mt-4 flex flex-col items-center">
        {isVerifying ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verifying transaction...</span>
          </div>
        ) : verificationResult ? (
          verificationErrors?.length > 0 ? (
            <div className="w-full">
              <div className="flex items-center justify-center gap-2 text-sm text-red-600 mb-4">
                <OctagonX className="h-4 w-4" />
                <span>Verification errors found by the Adamik SDK!</span>
              </div>
              
              {/* Side-by-side comparison */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-slate-700">
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-green-400 mb-3 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Intended Transaction
                    </h3>
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-red-400 mb-3 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Actual Transaction
                    </h3>
                  </div>
                </div>
                
                {verificationErrors.map((error, index) => (
                  <div key={index} className="grid grid-cols-2 divide-x divide-slate-700 border-t border-slate-700">
                    <div className="p-3">
                      <div className="text-xs text-gray-400 mb-1">
                        {formatFieldName(error.context?.field || '')}
                      </div>
                      <div className="text-sm text-green-300">
                        {formatValue(error.context?.expected)}
                      </div>
                    </div>
                    <div className="p-3 bg-red-950/20">
                      <div className="text-xs text-gray-400 mb-1">
                        {formatFieldName(error.context?.field || '')}
                      </div>
                      <div className="text-sm text-red-300">
                        {formatValue(error.context?.actual)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Collapsible raw transaction */}
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRawTransaction(!showRawTransaction)}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  {showRawTransaction ? (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Hide Raw Transaction
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-3 w-3 mr-1" />
                      Show Raw Transaction
                    </>
                  )}
                </Button>
                
                {showRawTransaction && (
                  <div className="mt-2">
                    <Textarea
                      readOnly
                      value={transactionRaw.value}
                      className="h-[150px] text-xs text-gray-500 w-full resize-none font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Verified locally using the Adamik decoder</span>
            </div>
          )
        ) : null}
      </div>
    </>
  );
}
