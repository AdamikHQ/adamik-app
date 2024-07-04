import { Loader } from "lucide-react";
import { Modal } from "../ui/modal";
import { useState } from "react";

const tipsList: string[] = [
  "Adamik allows you to stake assets on multiple chains.",
  "Adamik does not store your account information.",
  "Adamik simplifies reading data from multiple blockchains.",
  "Adamik makes developing multichain applications easier.",
  "Adamik does not have access to your keys. You remain in control.",
  "Adamik translates your intent into a blockchain transaction.",
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
            This may take up to 15 seconds.
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
