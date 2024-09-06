"use client";

import { Info, Search } from "lucide-react";
import { useMemo, useState } from "react";
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
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { amountToMainUnit, formatAmount } from "~/utils/helper";

export default function Data() {
  const [input, setInput] = useState<{
    chainId: string | undefined;
    transactionId: string | undefined;
  }>({ chainId: undefined, transactionId: undefined });

  const form = useForm();

  // TODO Proper schema
  function onSubmit(data: any) {
    setInput(data);
  }

  const { isLoading: isSupportedChainsLoading, data: supportedChains } =
    useChains();

  const {
    isLoading: isTransactionLoading,
    data: transaction,
    error,
  } = useGetTransaction(input);

  const selectedChain = useMemo(() => {
    return Object.values(supportedChains || {}).find(
      (chain) => chain.id === input.chainId
    );
  }, [supportedChains, input]);

  // FIXME DEBUG TBR
  console.log("XXX - selectedChain: ", selectedChain);

  const amount = useMemo(
    () =>
      transaction?.parsed?.recipients?.length
        ? transaction.parsed.recipients[0].amount
        : transaction?.parsed?.validators?.target?.amount,
    [transaction?.parsed]
  );

  const formattedAmount = useMemo(
    () =>
      amount !== undefined && selectedChain
        ? amountToMainUnit(amount, selectedChain.decimals)
        : null,
    [amount, selectedChain]
  );

  const formattedFees = useMemo(
    () =>
      transaction?.parsed?.fees && selectedChain
        ? amountToMainUnit(transaction?.parsed?.fees, selectedChain.decimals)
        : null,
    [transaction?.parsed?.fees, selectedChain]
  );

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-h-[100vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Data</h1>
        <Tooltip text="View the API documentation for retrieving transactions">
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
          className="w-2/3 space-y-6"
        >
          <FormField
            control={form.control}
            name="chainId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chain</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
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
                        .map((chain) => {
                          return (
                            <SelectItem key={chain.id} value={chain.id}>
                              {chain.name}
                            </SelectItem>
                          );
                        })}
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
          <Button type="submit">
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
          <CardContent>
            <div className="grid gap-3">
              {transaction && !transaction?.parsed ? (
                <>Parsing unavailable for this transaction</>
              ) : (
                <dl className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">ID</dt>
                    <dd>{transaction?.parsed?.id}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd>{transaction?.parsed?.mode}</dd>
                  </div>
                  {/* TODO Move to a specific "tokens" section ? */}
                  {transaction?.parsed?.tokenId && (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground"> Token ID</dt>
                      <dd>{transaction?.parsed?.tokenId}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">State</dt>
                    <dd>{transaction?.parsed?.state}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Block height</dt>
                    <dd>{transaction?.parsed?.blockHeight}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Date</dt>
                    <dd>
                      {transaction?.parsed?.timestamp &&
                        new Date(transaction.parsed.timestamp).toUTCString()}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Amount</dt>
                    <dd>
                      {transaction &&
                        `${formattedAmount} ${selectedChain?.ticker}`}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Fees</dt>
                    <dd>
                      {transaction &&
                        `${formattedFees} ${selectedChain?.ticker}`}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Gas</dt>
                    <dd>{transaction?.parsed?.gas}</dd>
                  </div>
                  {/* TODO Handle multiple senders */}
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Sender</dt>
                    <dd>
                      {transaction?.parsed?.senders?.length &&
                        transaction?.parsed?.senders[0].address}
                    </dd>
                  </div>
                  {/* TODO Handle multiple recipients */}
                  {transaction?.parsed?.recipients?.length && (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Recipient</dt>
                      <dd>{transaction?.parsed?.recipients[0].address}</dd>
                    </div>
                  )}
                  {/* TODO Move to a specific "staking" section ? */}
                  {transaction?.parsed?.validators?.source && (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">
                        Source validator
                      </dt>
                      <dd>{transaction?.parsed?.validators.source.address}</dd>
                    </div>
                  )}
                  {/* TODO Move to a specific "staking" section ? */}
                  {transaction?.parsed?.validators?.target && (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">
                        Target validator
                      </dt>
                      <dd>{transaction?.parsed?.validators.target.address}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Nonce</dt>
                    <dd>{transaction?.parsed?.nonce}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Memo</dt>
                    <dd>{transaction?.parsed?.memo}</dd>
                  </div>
                </dl>
              )}
            </div>
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
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={JSON.stringify(transaction?.raw)}
              className="text-s text-gray-500 mt-4"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

/*
export type FinalizedTransaction = {
  parsed?: {
    chainId: string;
    id: string;
    mode: TransactionMode;
    tokenId?: string;
    state: string;
    blockHeight?: bigint;
    timestamp?: number;
    senders: {
      address: string;
    }[];
    recipients: {
      address: string;
      amount: bigint;
    }[];
    validators?: {
      source?: {
        address: string;
      };
      target?: {
        address: string;
        amount: bigint;
      };
    };
    fees: bigint;
    gas?: bigint;
    nonce?: bigint;
    memo?: string;
  };
  raw: unknown; // The raw transaction as returned from the node (or explorer when necessary)
};
*/
