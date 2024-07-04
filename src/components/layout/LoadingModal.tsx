import { Loader } from "lucide-react";
import { Modal } from "../ui/modal";
import { useState } from "react";

const tipsList: string[] = [
  "Adamik allows you to stake your assets on multiple chains",
  "Adamik test message 1",
  "Adamik test message 2",
  "Adamik test message 3",
  "Adamik test message 4",
  "Adamik test message 5",
  "Adamik test message 6",
];

function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const LoadingModal = () => {
  const [randomIndex] = useState(randomIntFromInterval(0, tipsList.length - 1));

  return (
    <Modal
      open={true}
      modalContent={
        <div className="flex items-center flex-col gap-4">
          <h1 className="text-2xl font-semibold text-center">
            Adamik is updating your assets
          </h1>
          <p className="text-center text-sm text-gray-400">
            This should only take about 30 seconds.
          </p>
          <Loader className="animate-spin h-12 w-12 text-blue-500" />
          <div className="mt-4 p-4 border-t border-gray-600 w-full text-center text-sm bg-gray-800 rounded-lg">
            <span className="font-semibold">Did you know?</span> <br />
            {tipsList[randomIndex]}
          </div>
        </div>
      }
    />
  );
};
