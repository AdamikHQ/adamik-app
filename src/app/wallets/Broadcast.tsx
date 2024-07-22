import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useBroadcastMutation } from "~/hooks/useBroadcastMutation";
import { useTransaction } from "~/hooks/useTransaction";
import { useToast } from "~/components/ui/use-toast";

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
  const { toast } = useToast();
  const [error, setError] = useState<string | undefined>();
  const [currentStep, setCurrentStep] = useState(1);

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

  const handleNextStep = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const handleBroadcast = () => {
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
            toast({
              description:
                "Transaction has been successfully broadcasted. Your balance will be updated in a few moments",
            });
            setSignedTransaction(undefined);
            onNextStep();
          }
        },
      }
    );
  };

  if (currentStep === 1) {
    return (
      <div className="p-12 py-2 flex flex-col gap-6 items-center">
        <h1 className="font-extrabold text-2xl text-center mb-4">
          Verify Your Transaction
        </h1>
        <Textarea
          readOnly
          value={JSON.stringify(signedTransaction, null, 2)}
          className="h-32 text-xs text-gray-500 mt-4"
        />
        <div className="flex gap-6">
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
          <Button variant="default" onClick={handleNextStep}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 py-2 flex flex-col gap-6 items-center">
      <h1 className="font-extrabold text-2xl text-center mb-4">
        Broadcast with Adamik
      </h1>
      {isPending && <Loader2 className="animate-spin" height={32} width={32} />}
      {error && <div className="text-red-500">{error}</div>}
      <div className="flex gap-6">
        <Button
          disabled={isPending}
          variant="secondary"
          onClick={handlePreviousStep}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          disabled={isPending}
          onClick={handleBroadcast}
        >
          Broadcast
        </Button>
      </div>
    </div>
  );
};
