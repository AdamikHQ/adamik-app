import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useBroadcastMutation } from "~/hooks/useBroadcastMutation";
import { useTransaction } from "~/hooks/useTransaction";

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
      <Textarea readOnly value={signedTransaction} className="h-32" />

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
                console.log({ values });
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
    </div>
  );
};
