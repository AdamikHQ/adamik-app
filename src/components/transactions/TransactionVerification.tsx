"use client";

import { ChevronDown, CheckCircle, Loader2, OctagonX } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Textarea } from "~/components/ui/textarea";
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

      // FIXME DEBUG TBR
      console.log("XXX - Adamik SDK verification result:", result);

      setVerificationResult(result);
      setIsVerifying(false);
    };

    verifyTransaction();
  }, [adamikSDK, apiResponse]);

  const verificationErrors = verificationResult?.criticalErrors || [];
  return (
    <>
      <div className="mt-4 flex items-center justify-center">
        {isVerifying ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verifying transaction...</span>
          </div>
        ) : verificationResult ? (
          verificationErrors?.length > 0 ? (
            <div className="w-full mb-4">
              <div className="flex items-center justify-center gap-2 text-sm text-red-600 mb-3">
                <OctagonX className="h-4 w-4" />
                <span>Verification errors found by the Adamik SDK!</span>
              </div>
              <div className="space-y-2">
                {verificationErrors.map((error, index) => (
                  <div
                    key={index}
                    className="bg-slate-800 border border-slate-600 rounded-md p-1.5"
                  >
                    <div className="text-sm font-medium mb-3">
                      {error.context?.field}
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 w-16">Expected:</span>
                        <span className="text-slate-400 font-mono break-all">
                          {JSON.stringify(error.context?.expected)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 w-16">Actual:</span>
                        <span className="text-red-400 font-mono break-all">
                          {JSON.stringify(error.context?.actual)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex-1 mt-4">
                <div className="text-center text-sm font-medium text-gray-700 mb-2">
                  Unsigned transaction:
                </div>
                <Textarea
                  readOnly
                  value={transactionRaw.value}
                  className="h-[150px] text-xs text-gray-500 w-full resize-none"
                />
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
