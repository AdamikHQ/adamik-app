"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Info,
  Search,
  Copy,
  Loader2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
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
import { formatAssetAmount } from "~/utils/assetFormatters";
import {
  Chain,
  Token,
  FinalizedTransaction,
  TransactionFees,
} from "~/utils/types";
import { useToast } from "~/components/ui/use-toast";
import { getTokenInfo } from "~/api/adamik/token";

hljs.registerLanguage("json", json);

function DataContent() {
  const { theme } = useTheme();
  const [highlightedCode, setHighlightedCode] = useState("");
  const [tokenInfo, setTokenInfo] = useState<Token | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [isRawExpanded, setIsRawExpanded] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formattedAmount, setFormattedAmount] = useState<string>("N/A");
  const [formattedFees, setFormattedFees] = useState<string>("N/A");

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
    setFetchTrigger((prev) => prev + 1);
    setHasSubmitted(true);
  }

  const {
    data: transaction,
    error,
    isLoading,
  } = useGetTransaction({
    ...input,
    fetchTrigger,
  });

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
      fontSize: "0.75rem",
      padding: "0.5rem",
      borderRadius: "0.375rem",
      backgroundColor: theme === "dark" ? "#1e1e1e" : "#f5f5f5",
      color: theme === "dark" ? "#d4d4d4" : "#24292e",
      overflow: "auto",
      maxHeight: "40vh",
    };
  }, [theme]);

  useEffect(() => {
    const updateFormattedAmount = async () => {
      if (!transaction?.parsed) return;

      const { recipients, validators } = transaction.parsed;

      if (recipients && recipients[0]?.amount) {
        if (transaction?.parsed?.mode === "transferToken") {
          const result = await formatAssetAmount({
            asset: {
              chainId: selectedChain?.id || "",
              isToken: true,
              assetId: (transaction.raw as any).to,
            },
            amount: recipients[0].amount,
            chainData: supportedChains,
          });
          setFormattedAmount(`${result.formatted} ${result.ticker}`);
          return;
        }

        const result = await formatAssetAmount({
          asset: {
            chainId: selectedChain?.id || "",
            isToken: false,
          },
          amount: recipients[0].amount,
          chainData: supportedChains,
        });
        setFormattedAmount(`${result.formatted} ${result.ticker}`);
        return;
      }

      if (validators?.target?.amount) {
        const result = await formatAssetAmount({
          asset: {
            chainId: selectedChain?.id || "",
            isToken: false,
          },
          amount: validators.target.amount,
          chainData: supportedChains,
        });
        setFormattedAmount(`${result.formatted} ${result.ticker}`);
        return;
      }

      setFormattedAmount("N/A");
    };

    updateFormattedAmount();
  }, [transaction, selectedChain, supportedChains]);

  useEffect(() => {
    const updateFormattedFees = async () => {
      if (!transaction?.parsed?.fees) return;

      const result = await formatAssetAmount({
        asset: {
          chainId: selectedChain?.id || "",
          isToken: false, // Fees are currently assumed to be in native currency (NOTE: This won't always be the case)
        },
        amount:
          typeof transaction.parsed.fees === "string"
            ? transaction.parsed.fees
            : (transaction.parsed.fees as TransactionFees).amount,
        chainData: supportedChains,
      });

      setFormattedFees(`${result.formatted} ${result.ticker}`);
    };

    updateFormattedFees();
  }, [transaction, selectedChain, supportedChains]);

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

    if (!hasSubmitted) {
      return <p>Enter a valid transaction ID</p>;
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

    const formatRecipient = () => {
      if (!transaction?.parsed) return "N/A";
      const { recipients, validators } = transaction.parsed;

      if (recipients && recipients[0]?.address) {
        return recipients[0].address;
      } else if (validators?.target?.address) {
        return validators.target.address;
      }
      return "N/A";
    };

    return (
      <div className="flex flex-col gap-6">
        {" "}
        {/* Add gap-6 for more vertical spacing */}
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
        <DataItem label="Amount" value={formattedAmount} />
        <DataItem label="Fees" value={formattedFees} />
        <DataItem label="Gas" value={gas || "N/A"} />
        <DataItem
          label="Sender"
          value={(senders && senders[0]?.address) || "N/A"}
        />
        <DataItem label="Recipient" value={formatRecipient()} />
        <DataItem label="Nonce" value={nonce || "N/A"} />
        <DataItem label="Memo" value={memo || "N/A"} />
      </div>
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="font-medium text-sm sm:text-base break-all">
        {value?.toString() || "N/A"}
      </dd>
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
          const info = await getTokenInfo(selectedChain.id, tokenAddress);
          setTokenInfo(info);
        }
      } else {
        setTokenInfo(null);
      }
    };

    fetchTokenInfo();
  }, [transaction, selectedChain]);

  const toggleRawExpand = () => {
    setIsRawExpanded(!isRawExpanded);
  };

  useEffect(() => {
    const chainId = searchParams.get("chainId");
    const transactionId = searchParams.get("transactionId");

    if (chainId && transactionId) {
      form.setValue("chainId", chainId);
      form.setValue("transactionId", transactionId);

      setInput({ chainId, transactionId });
      setFetchTrigger((prev) => prev + 1);
      setHasSubmitted(true);
    }
  }, [searchParams, form]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto w-full">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">
          Transaction Details
        </h1>
        <Tooltip text="View the API documentation for retrieving transaction data">
          <a
            href="https://docs.adamik.io/api-reference/endpoint/get-apichains-chainid-transaction-transactionid"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
          </a>
        </Tooltip>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-2xl space-y-4 md:space-y-6"
        >
          <FormField
            control={form.control}
            name="chainId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chain</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a chain" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[40vh]">
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
                  <Input
                    placeholder="transaction id"
                    {...field}
                    className="w-full"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {!!error && (
            <div className="text-red-500 w-full break-all">{error.message}</div>
          )}
          <Button type="submit" className="w-full sm:w-auto" onClick={() => {}}>
            <Search className="mr-2" />
            Search
          </Button>
        </form>
      </Form>

      <div className="grid gap-4 md:gap-8 grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center">
              <CardTitle>Parsed</CardTitle>
              <Tooltip text="Parsed fields of the transaction">
                <Info className="w-4 h-4 ml-2 text-gray-500 cursor-pointer" />
              </Tooltip>
            </div>
          </CardHeader>
          {/* Remove max-height constraints and keep overflow-y-auto just in case */}
          <CardContent className="overflow-y-auto p-2 lg:p-4">
            <div className="mt-0">{renderParsedData(transaction)}</div>
          </CardContent>
        </Card>

        <div>
          <Button
            onClick={toggleRawExpand}
            variant="outline"
            className="w-full justify-between"
          >
            <span>Raw Data</span>
            {isRawExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          {isRawExpanded && (
            <Card className="mt-4">
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
              <CardContent className="max-h-[40vh] lg:max-h-[50vh] overflow-y-auto px-4">
                {renderRawData()}
              </CardContent>
            </Card>
          )}
        </div>
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
