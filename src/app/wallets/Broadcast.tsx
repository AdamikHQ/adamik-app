import { Loader2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useBroadcastMutation } from "~/hooks/useBroadcastMutation";
import { useTransaction } from "~/hooks/useTransaction";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

type BroadcastProps = {
  onNextStep: () => void;
};

export const Broadcast = ({ onNextStep }: BroadcastProps) => {
  const {
    transaction,
    setTransactionHash,
    signedTransaction,
    setSignedTransaction,
  } = useTransaction();
  const { mutate, isPending } = useBroadcastMutation();
  const [error, setError] = useState<string | undefined>();

  if (!transaction || !signedTransaction) {
    return (
      <div className="p-12 py-2 flex flex-col gap-6 items-center">
        <div className="text-center text-xl">Broadcast with Adamik</div>

        <div className="mb-8 text-center">
          No transaction found. Please retry the transaction.
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            onNextStep();
            setTransactionHash(undefined);
            setSignedTransaction(undefined);
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="p-12 py-2 flex flex-col gap-6 items-center">
      <div className="text-center text-xl">Broadcast with Adamik</div>
      {isPending && <Loader2 className="animate-spin" height={32} width={32} />}
      {error && <div className="text-red-500">{error}</div>}

      <div className="flex gap-6">
        <Button
          disabled={isPending}
          variant="secondary"
          onClick={() => {
            onNextStep();
            setTransactionHash(undefined);
            setSignedTransaction(undefined);
          }}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          disabled={isPending}
          onClick={() => {
            mutate(
              {
                transaction: transaction.transaction.plain,
                encodedTransaction: transaction.transaction.encoded,
                signature: signedTransaction,
              },
              {
                onSuccess: (values) => {
                  if (values.error) {
                    setError(values.error.message);
                  } else {
                    setTransactionHash(values.hash);
                    setSignedTransaction(undefined);
                  }
                },
              }
            );
          }}
        >
          Broadcast
        </Button>
      </div>

      <Collapsible>
        <CollapsibleTrigger className="text-sm text-gray-500 text-center mx-auto block flex items-center justify-center">
          <ChevronDown className="mr-2" size={16} />
          View signed transaction
          <ChevronDown className="ml-2" size={16} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Textarea
            readOnly
            value={JSON.stringify(signedTransaction)}
            className="h-32 text-xs text-gray-500 mt-4"
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
