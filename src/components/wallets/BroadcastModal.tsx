import { Loader2, ChevronDown } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useBroadcastTransaction } from "~/hooks/useBroadcastTransaction";
import { useTransaction } from "~/hooks/useTransaction";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { useToast } from "~/components/ui/use-toast";

type BroadcastProps = {
  onNextStep: () => void;
};

export const BroadcastModal = ({ onNextStep }: BroadcastProps) => {
  const { transaction, setTransaction, setTransactionHash } = useTransaction();
  const { toast } = useToast();
  const { mutate, isPending } = useBroadcastTransaction();
  const [error, setError] = useState<string | undefined>();

  const broadcast = useCallback(() => {
    transaction &&
      mutate(transaction, {
        onSuccess: (values) => {
          if (values.error) {
            setError(values.error.message);
          } else {
            setTransactionHash(values.hash);
            toast({
              description:
                "Transaction has been successfully broadcasted. Your balance will be updated in a few moments",
            });
            setTransaction(undefined);
          }
        },
      });
  }, [mutate, setTransaction, setTransactionHash, toast, transaction]);

  if (!transaction?.encoded || !transaction.signature) {
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
            setTransaction(undefined);
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="p-12 py-2 flex flex-col gap-6 items-center">
      <h1 className="font-extrabold text-2xl text-center mb-4">
        Broadcast with Adamik{" "}
      </h1>
      {isPending && <Loader2 className="animate-spin" height={32} width={32} />}
      {error && <div className="text-red-500">{error}</div>}

      <div className="flex gap-6">
        <Button
          disabled={isPending}
          variant="secondary"
          onClick={() => {
            onNextStep();
            setTransactionHash(undefined);
            setTransaction(undefined);
          }}
        >
          Cancel
        </Button>
        <Button variant="default" disabled={isPending} onClick={broadcast}>
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
            value={JSON.stringify(transaction.signature)}
            className="h-32 text-xs text-gray-500 mt-4"
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
