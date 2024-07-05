import { Loader } from "lucide-react";
import { Modal } from "../ui/modal";
import { useState } from "react";

const tipsList: JSX.Element[] = [
  <span key="tip-1">
    Adamik does not store your blockchain information.{" "}
    <a
      href="https://docs.adamik.io"
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "underline" }}
    >
      Learn more ⤴
    </a>
  </span>,
  <span key="tip-2">
    Adamik simplifies reading data from multiple blockchains.{" "}
    <a
      href="https://docs.adamik.io"
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "underline" }}
    >
      Learn more ⤴
    </a>
  </span>,
  <span key="tip-3">
    Adamik makes developing multichain applications easier.{" "}
    <a
      href="https://docs.adamik.io"
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "underline" }}
    >
      Learn more ⤴
    </a>
  </span>,
  <span key="tip-4">
    Adamik does not have access to your keys. You remain in control.{" "}
    <a
      href="https://docs.adamik.io"
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "underline" }}
    >
      Learn more ⤴
    </a>
  </span>,
  <span key="tip-5">
    Adamik translates your intent into a blockchain transaction.{" "}
    <a
      href="https://docs.adamik.io"
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "underline" }}
    >
      Learn more ⤴
    </a>
  </span>,
  <span key="tip-6">
    Adamik application is entirely open source. Check out our{" "}
    <a
      href="https://github.com/AdamikHQ/"
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "underline" }}
    >
      GitHub ⤴
    </a>
    .
  </span>,
  <span key="tip-7">
    Adamik application is powered by the Adamik API. Explore our{" "}
    <a
      href="https://docs.adamik.io"
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "underline" }}
    >
      documentation ⤴
    </a>
    .
  </span>,
  <span key="tip-8">
    You can explore Adamik API for free.{" "}
    <a
      href="https://dashboard.adamik.io"
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "underline" }}
    >
      Get your API key ⤴
    </a>
  </span>,
];

function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const LoadingModal = () => {
  const [randomIndex] = useState(randomIntFromInterval(0, tipsList.length - 1));

  return (
    <Modal
      open={true}
      displayCloseButton={false}
      modalContent={
        <div className="flex items-center flex-col gap-4">
          <h1 className="text-2xl font-semibold text-center">
            Retrieving blockchain data
          </h1>
          <p className="text-center text-sm text-gray-400">
            Adamik is processing your request. <br />
            Retrieving all information may take up to 15 seconds.
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
