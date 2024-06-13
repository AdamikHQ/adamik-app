import Image from "next/image";

type TransactionLoadingProps = {
  onNextStep: () => void;
};

export const TransactionLoading = ({ onNextStep }: TransactionLoadingProps) => {
  setTimeout(() => {
    onNextStep();
  }, 3000);

  return (
    <div>
      <div className="flex h-[120px] w-[120px] items-center m-auto">
        <Image
          className="animate-spin"
          alt="Adamik logo"
          src="/adamik-logo-dark.png"
          width={92}
          height={92}
        />
      </div>

      <div className="">
        Your transaction request has been sent to the Adamik API, and processing
        is currently underway!
      </div>
    </div>
  );
};
