"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Info, Search, Copy, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { formatDistanceToNow } from "date-fns";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import { useTheme } from "next-themes";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Tooltip } from "~/components/ui/tooltip";
import { useGetTransaction } from "~/hooks/useGetTransaction";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useChains } from "~/hooks/useChains";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { amountToMainUnit, formatAmount } from "~/utils/helper";
import { Chain, Token, FinalizedTransaction } from "~/utils/types";
import { useToast } from "~/components/ui/use-toast";
import { getTokenInfo } from "~/api/adamik/tokens";

hljs.registerLanguage("json", json);

function DataContent() {
  const { theme } = useTheme();
  const [highlightedCode, setHighlightedCode] = useState("");
  const [tokenInfo, setTokenInfo] = useState<Token | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const searchParams = useSearchParams();
  const { isLoading: isSupportedChainsLoading, data: supportedChains } =
    useChains();

  const form = useForm({
    defaultValues: {
      chainId: searchParams.get("chainId") || "",
      transactionId: searchParams.get("transactionId") || "",
    },
  });

  const [input, setInput] = useState<{
    chainId: string | undefined;
    transactionId: string | undefined;
  }>({ chainId: undefined, transactionId: undefined });

  function onSubmit(data: any) {
    console.log("Search button clicked. New input:", data);
    setInput(data);
    setFetchTrigger((prev) => {
      console.log("Incrementing fetch trigger. New value:", prev + 1);
      return prev + 1;
    });
  }

  const {
    data: transaction,
    error,
    isLoading,
  } = useGetTransaction({
    ...input,
    fetchTrigger,
  });

  useEffect(() => {
    console.log("Transaction data changed:", transaction);
  }, [transaction]);

  useEffect(() => {
    console.log("Fetch trigger changed:", fetchTrigger);
  }, [fetchTrigger]);

  const selectedChain = useMemo<Chain | undefined>(() => {
    return Object.values(supportedChains || {}).find(
      (chain) => chain.id === input.chainId
    );
  }, [supportedChains, input]);

  const formattedRawData = useMemo(() => {
    if (transaction?.raw) {
      return JSON.stringify(transaction.raw, null, 2);
    }
    return "";
  }, [transaction?.raw]);

  useEffect(() => {
    if (formattedRawData) {
      const highlighted = hljs.highlight(formattedRawData, {
        language: "json",
      }).value;
      setHighlightedCode(highlighted);
    }
  }, [formattedRawData]);

  const codeStyle = useMemo(() => {
    return {
      fontSize: "0.875rem",
      padding: "1rem",
      borderRadius: "0.375rem",
      backgroundColor: theme === "dark" ? "#1e1e1e" : "#f5f5f5",
      color: theme === "dark" ? "#d4d4d4" : "#24292e",
    };
  }, [theme]);

  const renderParsedData = (
    transaction: FinalizedTransaction | null | undefined
  ) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!transaction?.parsed) return <p>No parsed data available</p>;

    const {
      id,
      mode,
      state,
      blockHeight,
      timestamp,
      fees,
      gas,
      nonce,
      memo,
      senders,
      recipients,
      validators,
    } = transaction.parsed;

    const formatFees = (fees: any) => {
      if (typeof fees === "string") {
        const mainUnitFees = amountToMainUnit(
          fees,
          selectedChain?.decimals || 18
        );
        return `${formatAmount(mainUnitFees, selectedChain?.decimals || 18)} ${
          selectedChain?.ticker || ""
        }`;
      } else if (fees && fees.amount) {
        const ticker = fees.ticker || selectedChain?.ticker || "";
        const mainUnitFees = amountToMainUnit(
          fees.amount,
          selectedChain?.decimals || 18
        );
        return `${formatAmount(
          mainUnitFees,
          selectedChain?.decimals || 18
        )} ${ticker}`;
      }
      return "N/A";
    };

    const formatTransactionAmount = () => {
      if (recipients && recipients[0]?.amount) {
        if (tokenInfo) {
          const amount = BigInt(recipients[0].amount);
          const formattedAmount = Number(amount) / 10 ** tokenInfo.decimals;
          return `${formatAmount(
            formattedAmount.toString(),
            tokenInfo.decimals
          )} ${tokenInfo.ticker}`;
        }
        const mainUnitAmount = amountToMainUnit(
          recipients[0].amount,
          selectedChain?.decimals || 18
        );
        return `${formatAmount(
          mainUnitAmount,
          selectedChain?.decimals || 18
        )} ${selectedChain?.ticker || ""}`;
      } else if (validators?.target?.amount) {
        const mainUnitAmount = amountToMainUnit(
          validators.target.amount,
          selectedChain?.decimals || 18
        );
        return `${formatAmount(
          mainUnitAmount,
          selectedChain?.decimals || 18
        )} ${selectedChain?.ticker || ""}`;
      }
      return "N/A";
    };

    const formatRecipient = () => {
      if (recipients && recipients[0]?.address) {
        return recipients[0].address;
      } else if (validators?.target?.address) {
        return validators.target.address;
      }
      return "N/A";
    };

    return (
      <dl className="grid gap-3">
        <DataItem label="ID" value={id} />
        <DataItem label="Type" value={mode} />
        <DataItem label="State" value={state} />
        <DataItem label="Block height" value={blockHeight} />
        <DataItem
          label="Date"
          value={
            timestamp
              ? formatDistanceToNow(new Date(Number(timestamp)), {
                  addSuffix: true,
                })
              : "N/A"
          }
        />
        <DataItem label="Amount" value={formatTransactionAmount()} />
        <DataItem label="Fees" value={formatFees(fees)} />
        <DataItem label="Gas" value={gas || "N/A"} />
        <DataItem
          label="Sender"
          value={(senders && senders[0]?.address) || "N/A"}
        />
        <DataItem label="Recipient" value={formatRecipient()} />
        <DataItem label="Nonce" value={nonce || "N/A"} />
        <DataItem label="Memo" value={memo || "N/A"} />
      </dl>
    );
  };

  const renderRawData = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!formattedRawData) return <p>No raw data available</p>;

    return (
      <div style={codeStyle} className="h-full">
        <pre className="text-sm overflow-x-auto h-full m-0">
          <code
            className="language-json block"
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    );
  };

  const DataItem = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | bigint;
  }) => (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value?.toString() || "N/A"}</dd>
    </div>
  );

  const { toast } = useToast();

  const handleCopyRawData = () => {
    if (formattedRawData) {
      navigator.clipboard
        .writeText(formattedRawData)
        .then(() => {
          toast({
            title: "Copied!",
            description: "Raw data has been copied to clipboard",
            duration: 2000,
          });
        })
        .catch((error) => {
          toast({
            title: "Copy failed",
            description: "Unable to copy raw data to clipboard",
            variant: "destructive",
            duration: 3000,
          });
        });
    }
  };

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (transaction?.parsed?.mode === "transferToken" && selectedChain) {
        const tokenAddress = (transaction.raw as any).to;
        if (typeof tokenAddress === "string") {
          // Fetch token info using the chain ID and token address
          const info = await getTokenInfo(selectedChain.id, tokenAddress);
          setTokenInfo(info);
        }
      } else {
        setTokenInfo(null);
      }
    };

    fetchTokenInfo();
  }, [transaction, selectedChain]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-2/3 space-y-6"
        >
          <FormField
            control={form.control}
            name="chainId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chain</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a chain" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {!isSupportedChainsLoading &&
                      supportedChains &&
                      Object.values(supportedChains)
                        ?.sort((chainA, chainB) =>
                          chainA.name.localeCompare(chainB.name)
                        )
                        .map((chain) => (
                          <SelectItem key={chain.id} value={chain.id}>
                            {chain.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transactionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction ID</FormLabel>
                <FormControl>
                  <Input placeholder="transaction id" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          {!!error && (
            <div className="text-red-500 w-full break-all">{error.message}</div>
          )}
          <Button
            type="submit"
            onClick={() => console.log("Search button clicked")}
          >
            <Search />
          </Button>
        </form>
      </Form>

      <div className="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center">
              <CardTitle>Parsed</CardTitle>
              <Tooltip text="Parsed fields of the transaction">
                <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="max-h-[50vh] overflow-y-auto p-4">
            <div className="mt-0">{renderParsedData(transaction)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center">
              <CardTitle>Raw</CardTitle>
              <Tooltip text="Raw transaction from the blockchain">
                <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
              </Tooltip>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyRawData}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="max-h-[50vh] overflow-y-auto px-4">
            {renderRawData()}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function Data() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DataContent />
    </Suspense>
  );
}
