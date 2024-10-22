"use client";

import { Suspense } from "react";
import { Info } from "lucide-react";
import { Tooltip } from "~/components/ui/tooltip";

function TransactionHistoryContent() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">
            Transaction History
          </h1>
          <Tooltip text="View the API documentation for retrieving transaction history">
            <a
              href="https://docs.adamik.io/api-reference/endpoint/post-apiaccounthistory"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
            </a>
          </Tooltip>
        </div>
      </div>
      {/* Add your transaction history content here */}
    </main>
  );
}

export default function TransactionHistory() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TransactionHistoryContent />
    </Suspense>
  );
}
