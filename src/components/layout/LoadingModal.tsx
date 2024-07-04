import { Loader } from "lucide-react";
import { Modal } from "../ui/modal";

const tipsList: string[] = [
  "Adamik allows you to stake your assets on multiple chains",
  "Adamik test message",
];

function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const LoadingModal = () => {
  return (
    <Modal
      open={true}
      modalContent={
        <div className="flex items-center flex-col gap-4">
          <h1 className="text-2xl font-semibold text-center">
            Adamik is retrieving your assets, <br />
            it should not take more than 30 seconds
          </h1>
          <Loader className="animate-spin h-12 w-12" />
          <div>
            {`Did you know that: ${
              tipsList[randomIntFromInterval(0, tipsList.length - 1)]
            }`}
          </div>
        </div>
      }
    />
  );
};
